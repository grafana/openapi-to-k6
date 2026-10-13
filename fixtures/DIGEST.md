# Digest: how openapi-to-k6 turns a spec into a client

This is a context extract of how `openapi-to-k6` v0.4.1 (the current JS tool) turns
an OpenAPI/Swagger spec into a k6 TypeScript client. It is written for someone (human
or AI agent) who needs to design a similar tool in Go, as a k6 subcommand. It is
similar functionality, not a byte-for-byte port, so this note describes what the
current tool does, not what the new one should do. Treat every rule here as "this is
the current behavior", not as a requirement.

Every claim below points at its source, so it can be checked directly instead of taken
on faith:

- Links into this project's own code point at `github.com/grafana/openapi-to-k6` at
  commit `d2105fd0d3ffec8a0c5b9aa30bab1088eee56615` (this is a permanent link to a
  fixed commit, so it will still work after `fixtures/` moves to its own repo without
  the old source).
- Links into `orval` (the code generator this tool wraps) point at
  `github.com/orval-labs/orval` at commit `a28fe2e1844ea55912a11b15c8e9eed040139280`,
  which is the exact commit that npm's `orval@7.21.0` (the version installed here) was
  published from.
- Some claims are grounded directly in the `generated/*.ts` and `*.d.ts` files already
  in this folder (see [`openapi-org/generated/`](openapi-org/generated/) and
  [`openapi-to-k6/generated/`](openapi-to-k6/generated/)), linked as plain relative
  paths since those files travel with this folder.

See [`COMPAT.md`](COMPAT.md) for a separate list of bugs and quirks. Anything listed
there is an accident of the current implementation, not a rule to copy.

## 1. Pipeline overview

`openapi-to-k6` is a thin wrapper. It does not parse OpenAPI itself. The real work
(parsing the spec, resolving `$ref`s, building the list of operations, and writing
files) is done by [`orval`](https://orval.dev/), a general-purpose OpenAPI-to-client
code generator. `openapi-to-k6` plugs a custom "client" definition into orval that
tells it how to render k6-flavored TypeScript instead of orval's usual `fetch`/`axios`
client.

The flow, in order:

1. `src/cli.ts` parses the command line and calls `generateSDK`
   ([cli.ts, lines 31 to 66](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/cli.ts#L31-L66)).
2. `src/generator/index.ts` calls `orval(...)` with the input path, the output path,
   the chosen mode, and a custom client builder
   ([generator/index.ts, lines 114 to 154](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/index.ts#L114-L154)).
3. Inside `orval`, `SwaggerParser.resolve()` loads the spec and every file it
   references through `$ref`, then each loaded document is passed through a Swagger
   2.0 to OpenAPI 3 converter if needed
   ([`packages/orval/src/import-specs.ts`, line 38](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/orval/src/import-specs.ts#L38),
   [`packages/orval/src/import-open-api.ts`, line 75](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/orval/src/import-open-api.ts#L75)).
4. `orval` walks every operation and calls the custom client builder once per
   operation to get its method body and imports, then writes the files.
5. `openapi-to-k6` post-processes each written file: it removes files that turned out
   empty, rewrites the type `Blob` to `ArrayBuffer` (k6 has no `Blob` global), and runs
   Prettier on the result
   ([generator/index.ts, lines 30 to 111](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/index.ts#L30-L111)).

## 2. Client shape

Every generated client, in every mode, has the same shape:

- One TypeScript class per spec (or per tag, in `tags` mode; see section 8).
- A constructor that takes `{ baseUrl: string, commonRequestParameters?: Params }`.
  `baseUrl` must be supplied by the caller at construction time. The OpenAPI
  `servers` field (including any server variables, such as
  [`openapi-org/uspto.json`](openapi-org/uspto.json)'s
  `{scheme}://developer.uspto.gov/ds-api`) is never read; nothing in the generated
  code references it at all. See the constructor in
  [`openapi-org/generated/uspto.ts`](openapi-org/generated/uspto.ts).
- One method per OpenAPI operation.
- Every method returns the same shape:
  `{ response: Response, data: <ResponseType>, operationId: string }`, regardless of
  the response's HTTP status. There is no status-code branching and nothing is ever
  thrown for a non-2xx response; the method always calls `response.json()`, falling
  back to the raw `response.body` if that throws, and returns it as `data` either
  way. A caller who wants to treat 4xx/5xx differently must check `response.status`
  themselves. See any method body, for example `listPets` in
  [`openapi-org/generated/petstore.ts`](openapi-org/generated/petstore.ts).
- No automatic handling of OpenAPI `security` / `securitySchemes`. A spec that
  declares a bearer scheme and requires it on an operation, such as
  [`openapi-org/non-oauth-scopes.json`](openapi-org/non-oauth-scopes.json), generates
  no authorization header and no auth-related argument from that `security`
  declaration; see
  [`openapi-org/generated/non-oauth-scopes.ts`](openapi-org/generated/non-oauth-scopes.ts).
  This is separate from an *explicit* `in: header` parameter named `Authorization`
  (or anything else): that still becomes a normal, typed, named `headers` argument
  the same way any other header parameter does (section 5). See
  [`openapi-to-k6/headers_schema.json`](openapi-to-k6/headers_schema.json), which
  declares both a bearer `securityScheme` (ignored) and a separate, explicit,
  required `Authorization` header parameter (not ignored): the generated
  `postExamplePost` method takes a required `headers: PostExamplePostHeaders`
  argument with an `Authorization: string` field, see
  [`openapi-to-k6/generated/headers_schema.d.ts`](openapi-to-k6/generated/headers_schema.d.ts).
  So: a header the spec declares as a parameter is generated as a typed argument; a
  header implied only by `security`/`securitySchemes` is not generated at all and
  must be sent by the caller through the generic `headers` field of `Params`
  instead.
- A private `_mergeRequestParameters` method that merges per-request parameters
  (headers, cookies, tags) with the client's common parameters, request overriding
  common.

See [`openapi-org/generated/petstore.d.ts`](openapi-org/generated/petstore.d.ts) for a
complete, small example of this shape. The class and constructor text come from
[`generateK6Header`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L271-L288),
the merge method from
[`_getRequestParametersMergerFunctionImplementation`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L57-L83),
and each method body from
[`generateK6Implementation`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L209-L264).

A response whose schema is `type: string, format: binary` (mapped to `Blob`, then to
`ArrayBuffer`, see section 4) also changes the actual k6 request: the method adds
`responseType: 'binary'` to the `http.request` options, as the last key in that
object, so it cannot be overridden by a `responseType` the caller passes in through
`Params`
([`_getRequestParamsValue`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L85-L128)).
The method still tries `response.json()` first and only falls back to `response.body`
if that throws (see below), same as any other response; for a binary response,
`response.json()` normally throws and the fallback is what actually gets returned.
Confirmed by generating a minimal spec with a `200` response of
`application/octet-stream` / `type: string, format: binary`: the generated method
returns `data: ArrayBuffer` and calls `http.request` with `responseType: "binary"`
set.

The `data` type in the return shape comes from every `2xx` response, not just one
status code. If there is more than one `2xx` response defined, their types are
combined into a union with `|`. A `2xx` response with no body becomes `void`, not
`ResponseBody`; see `createPets` in
[`openapi-org/generated/petstore.d.ts`](openapi-org/generated/petstore.d.ts), whose
`201` response has no body defined, and which generates `data: void`
([`getResponse`, lines 83 to 94](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/response.ts#L83-L94)).
If there are no `2xx` responses at all, orval falls back to the spec's `default`
response type, or `unknown` if there is none of those either. `openapi-to-k6` itself
adds one more fallback on top of that: if the resulting type is empty, `any`, or
`unknown`, it uses k6's generic `ResponseBody` type instead
([`_generateResponseTypeDefinition`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L36-L53)).

## 3. Naming rules

- **Class name**: `pascal(sanitize(info.title)) + "Client"`. If the spec has no
  `info.title`, the title defaults to the literal string `K6Client`
  ([`generateTitle`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L266-L269),
  default title constant at
  [constants.ts, line 1](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/constants.ts#L1)).
  Because the suffix `Client` is always appended, a spec with no title produces the
  class name `K6ClientClient`. This is confirmed in
  [`openapi-to-k6/generated/no_title_schema.d.ts`](openapi-to-k6/generated/no_title_schema.d.ts).
- **File name (single mode)**: `camel(info.title)`, with the same no-title fallback
  (so `k6Client.ts` for a titleless spec, lower case `k`).
- **Method name**: the OpenAPI `operationId` run through `camel()`, made into a valid
  JS identifier. If `operationId` is missing, orval builds one from the HTTP verb and
  the path, for example `get` plus `/pets/{id}` becomes `GetPetsId`, then that is
  camel-cased the same way
  ([`getOperationId`](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/operation.ts#L6),
  [`operationName` derivation](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/generators/verbs-options.ts#L85)).
  The original `operationId` string is kept as-is and returned at runtime in the
  `operationId` field of every method's return value.
- **Path template**: a path parameter like `/pets/{petId}` becomes a JS template
  literal `` `/pets/${petId}` `` with the parameter name camel-cased
  ([`getRoute`](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/route.ts#L29)).
  The value is interpolated into that template literal directly, with no URL
  encoding anywhere in the pipeline (neither `openapi-to-k6` nor this part of
  orval calls `encodeURIComponent` or similar). A path parameter value containing
  a character like `/` or `?` would land in the URL unescaped.

Serialization is otherwise minimal, and worth calling out as a gap rather than a
rule: query parameters are serialized with plain k6/JS `new
URLSearchParams(params).toString()` (section 6), which does percent-encode values,
but OpenAPI's parameter serialization keywords (`style`, `explode`, and the
matching rules for arrays and objects in a query, path, or header parameter) are not
implemented at all. Whatever `URLSearchParams` does with a given JS value (a string,
number, array, or object) is what you get; there is no per-parameter control over
comma-delimited versus repeated-key arrays, `deepObject` style, and so on.

## 4. Type mapping

OpenAPI schema types map to TypeScript types roughly like this
(from [`getScalar`](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/scalar.ts#L16)):

| OpenAPI schema | Generated TypeScript |
|---|---|
| `type: string` | `string` |
| `type: string`, `format: binary` | `Blob`, then rewritten by `openapi-to-k6` to `ArrayBuffer` (see section 1, step 5) |
| `type: string`, `format: date` or `date-time` | `string` by default (`Date` only if the `useDates` option is turned on, which `openapi-to-k6` does not turn on) |
| `type: string`, with `enum` | a union of string literals, for example `'a' \| 'b'` |
| `type: integer` / `type: number` | `number` |
| `type: boolean` | `boolean` |
| `type: array` | `T[]` |
| `type: object` with named `properties` | an `interface` (single mode/split mode) or `type` (varies), one field per property |
| a schema referenced by `$ref` | a named `interface` or `type` alias, named after the schema |
| `allOf` | an intersection or a merged object type, combining all listed schemas |
| `oneOf` / `anyOf` | a union type |
| `oneOf` with a `discriminator` | still a plain union, but each member's discriminator field is narrowed to a literal type, so it type-checks as a real discriminated union without special syntax |
| `nullable: true` | the mapped type with `| null` appended |

Two concrete, small examples already in this folder:

- [`openapi-org/generated/petstore.d.ts`](openapi-org/generated/petstore.d.ts): a
  `$ref`-based `Pet` interface, an array type `Pets` (`Pet[]`), and a bundled query
  parameter type `ListPetsParams`.
- [`openapi-org/generated/uspto.d.ts`](openapi-org/generated/uspto.d.ts): nested
  objects, an index signature (`[key: string]: ...`) for an open-ended object schema,
  and multiple required path parameters.

A bundled query-parameter type or a request body's own type name is synthesized from
the operation name, for example `ListPetsParams` for the query parameters of
`listPets`, or `PerformSearchBody` for the request body of `performSearch`. This
naming pattern is `pascal(operationName) + "Params"` or `pascal(operationName) +
"Body"`. Path parameters do not get a synthesized type; each one is an inline
positional primitive, for example `dataset: string` (see section 5). A named object
type for a group of path parameters only exists behind orval's own
`useNamedParameters` option, which `openapi-to-k6` does not turn on.

The discriminated-union narrowing mentioned in the type table works through a
`const` object plus `keyof`, not a literal string type directly, for example
`Cat.petType` is typed as `CatPetType`, where `CatPetType = { cat: "cat" } as
const`. The effect is the same as a plain literal type (`"cat"`), just built
that way so it can later hold more than one mapped value.

## 5. Parameter handling

Each path parameter becomes its own positional argument, named after the
(camel-cased) parameter name and typed from its schema. Example:
`showPetById(petId: string, ...)`. The request body, if any, becomes one positional
argument. Query parameters, if any, are bundled into one object argument named
`params`, typed as a generated `<OperationName>Params` type. Header parameters are
bundled the same way into a `headers` argument, if the `headers` output option is
turned on (`openapi-to-k6` turns this on:
[generator/index.ts, line 142](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/index.ts#L142)).
Every value in that `headers` argument is run through `String(value)` before being
merged into the actual request headers, since k6 only accepts string header values
but an OpenAPI header schema can be a number or boolean
([`k6Client.ts`, lines 118 to 120](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L118-L120)).
This coercion is specific to this bundled `headers` argument; it does not apply to
the generic `requestParameters.headers` described next, which is merged as supplied
with no coercion (section 2's `_mergeRequestParameters`).
Finally, `requestParameters?: Params` is always appended last and always optional.
This is the k6 `http.request` options object (headers, cookies, tags, and so on) for
that single call, merged with the client's common parameters (section 2).

**The order of everything before `requestParameters` is not fixed by category.** It
is built in the order path parameters, then body, then query params, then headers,
and then re-sorted: any parameter that has a schema `default` value is pushed to the
end of the list, and among the rest, required parameters come before optional ones
([`getProps`](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/props.ts#L108)
builds the list,
[`sortByPriority`](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/utils/sort.ts#L1)
does the re-sort). So a required body can end up before a path parameter that has a
default value. This is exactly what happens in
[`openapi-org/generated/uspto.d.ts`](openapi-org/generated/uspto.d.ts): `performSearch`
generates as `performSearch(performSearchBody: PerformSearchBody, dataset?: string,
version?: string, requestParameters?: Params)`, body first, even though `dataset` and
`version` are path parameters and normally path parameters come first.

**A parameter with a schema `default` value is optional in the generated signature,
even if the OpenAPI parameter itself is marked `required: true`.** In the same
`uspto` spec, `dataset` and `version` are both marked `required: true`, but each also
has a `default` (`"oa_citations"` and `"v1"`), so both come out as `dataset?: string`
and `version?: string`, not required
([`packages/core/src/getters/params.ts`, line 97](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/params.ts#L97):
the `?` is added when the parameter is not required, or when its schema has a
`default`, whichever is true). Contrast with `listSearchableFields` in the same file,
which has the same two path parameters but no `default` on them, so there they come
out required and positional: `listSearchableFields(dataset: string, version: string,
requestParameters?: Params)`.

## 6. Request body encodings

The request body is built differently depending on its content type
([`_getK6RequestOptions`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L130-L162)):

- **`application/json`**: `JSON.stringify(<bodyArgument>)`.
- **`multipart/form-data`**: built with k6's `FormData` helper from
  `jslib.k6.io/formdata`, sent as `formData.body()`, with the `Content-Type` header
  set to `multipart/form-data; boundary=` plus `formData.boundary`.
- **`application/x-www-form-urlencoded`**: the body object's values are all converted
  to strings first (k6 requires string values for form-urlencoded bodies), since the
  OpenAPI schema may type them as numbers or booleans.
- Any other content type: the body argument is passed through as-is.

Two small worked examples:
[`openapi-to-k6/generated/form_data_schema.ts`](openapi-to-k6/generated/form_data_schema.ts)
and
[`openapi-to-k6/generated/form_url_encoded_data_schema.ts`](openapi-to-k6/generated/form_url_encoded_data_schema.ts).

Query parameters, when present, are appended to the URL with k6's `URLSearchParams`
helper, also from `jslib.k6.io`.
[`getK6Dependencies`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6Client.ts#L164-L207)
declares `URL`, `URLSearchParams`, and `FormData` (all from `jslib.k6.io`) as
available imports for the generator to use, but orval only emits the ones actually
referenced in that file, not all of them unconditionally. For example
[`openapi-to-k6/generated/simple_post_request_schema.ts`](openapi-to-k6/generated/simple_post_request_schema.ts)
imports only `URL` (no query params or form data in that spec), while
[`openapi-to-k6/generated/form_data_schema.ts`](openapi-to-k6/generated/form_data_schema.ts)
imports `URL` and `FormData` but not `URLSearchParams`.

## 7. Output modes

`--mode` controls only how the output is split into files, not the generated logic.
This is checked directly by running the same input through all three modes and
comparing the method bodies. Anyone with a checkout of `openapi-to-k6` (this repo,
not the moved `fixtures/` folder alone) can reproduce this with the fixture already
in this folder. A fresh checkout has no build output yet, so this needs either
`npm run dev --` (the documented development entry point, see the root `README.md`)
or `npm run build` first; it does not work by calling `openapi-to-k6` directly
before either of those:

```
npm run dev -- fixtures/openapi-org/petstore.json /tmp/out-single --mode single
npm run dev -- fixtures/openapi-org/petstore.json /tmp/out-split  --mode split
npm run dev -- fixtures/openapi-org/petstore.json /tmp/out-tags   --mode tags
```

Doing this produces byte-identical method bodies and signatures for `listPets` in
all three outputs. What differs between modes is not only file layout, though: in
`single` and `split` mode the class is `SwaggerPetstoreClient` (named after
`info.title`), but in `tags` mode it is `PetsClient` (named after the tag), since
`tags` mode calls the same title builder once per tag file instead of once for the
whole spec. So a consumer's import statement and constructed class name also change
with the mode, not just which file(s) exist. See the mode-by-mode list below for the
rest of what changes.

- **`single`** (default): one file with everything.
- **`split`**: the client class in one file, plus a second `<name>.schemas.ts` file
  with just the types, but only when there are any types worth extracting. A spec
  with no named schemas (for example `non-oauth-scopes.json`) produces only the one
  client file, no `.schemas.ts`.
- **`tags`**: one file per tag that is actually used on at least one operation, each
  with its own client class named after the tag (for example `PetsClient` for the tag
  `pets`). A tag only declared at the top level, with no operation using it, gets no
  file at all. This can be reproduced with a minimal spec such as:

  ```json
  {
    "openapi": "3.0.0",
    "info": { "title": "Unused Tag Test", "version": "1.0.0" },
    "tags": [{ "name": "used" }, { "name": "unused" }],
    "paths": {
      "/things": {
        "get": {
          "operationId": "listThings",
          "tags": ["used"],
          "responses": { "200": { "description": "ok" } }
        }
      }
    }
  }
  ```

  Running this through `--mode tags` produces only `used.ts`; no `unused.ts` is
  written. Operations without a tag land in `default.ts`. A shared types file is
  only added when there are types to share; the `non-oauth-scopes.json` spec
  produces just `default.ts` and nothing else in `tags` mode.

## 8. CLI surface

The command is `openapi-to-k6 <openApiPath> <outputDir> [options]`
([cli.ts, lines 68 to 146](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/cli.ts#L68-L146)):

| Flag | Effect |
|---|---|
| `-m, --mode <single\|split\|tags>` | Output layout, see section 7. Defaults to `single`. |
| `--only-tags <filters...>` | Only include operations with one of the given tags. Can be repeated or space-separated. |
| `--include-sample-script` | Also generate a sample k6 script that calls every method (see section 9 for its quirks). |
| `-v, --verbose` | Print debug logs, including the real error when generation fails (see below). |
| `--disable-analytics` | Turn off anonymous usage reporting. Also settable with the `DISABLE_ANALYTICS=true` environment variable. |

**Worth flagging:** this is an observed fact, not part of any intended contract, so
whether to carry it over is a real choice, not a given. The CLI never sets a
non-zero exit code, even when generation completely fails. The error is caught and
only logged
([cli.ts, lines 122 to 138](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/cli.ts#L122-L138)).
See [`COMPAT.md`](COMPAT.md) for what this looks like in practice and why it matters
for scripting.

## 9. Sample script generation

With `--include-sample-script`, a second file (`k6-script.sample.ts`) is generated: a
k6 script that imports the client, creates one instance, and calls every generated
method once with example argument values
([`k6ScriptBuilder.ts`](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6ScriptBuilder.ts)).
Calling this script "runnable" needs a caveat: it is runnable JavaScript at the k6
level, but as shown below it can assign values of the wrong TypeScript type to a
typed body argument, so it does not always type-check.

Only **required** top-level parameters (path/body/query/headers) get an example
value assignment line at all; an optional top-level parameter is left out of the
script entirely. Each such value is chosen in this order:

1. The `example` value on the parameter's or request body's **schema**, if present.
   A Parameter Object can also carry its own top-level `example` field, separate
   from `schema.example`, but that field is not read; only `schema.example` is used
   (the `uspto.json` fixture shows this: its `dataset` and `version` path parameters
   have a top-level `example` with an empty `schema: { type: "string" }`, so the
   sample script falls through to Faker for both instead of using either example
   value).

   For a **path** parameter specifically, this step has a bug worth calling out on
   its own: the code does not look up the schema of the path parameter it is
   currently generating a value for. It always uses the *first* entry in the
   operation's `parameters` list
   ([`k6ScriptBuilder.ts`, lines 148 to 170](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/k6ScriptBuilder.ts#L148-L170)),
   with no check that it is even a path parameter. On an operation with two or more
   path parameters, every one of them ends up with the first path parameter's
   example value. Confirmed with a two-path-parameter test operation
   (`/things/{thingId}/subthings/{subId}`, `thingId` an integer with example `111`,
   `subId` a string with example `"abc-sub"`): the generated script sets both
   `thingId = "111"` and `subId = "111"`, silently dropping `subId`'s own example.
2. Otherwise, a random value from the Faker library, picked by basic type: a random
   word for strings, a random integer for numbers, a random boolean for booleans, an
   empty array for arrays.

Two quirks worth carrying over deliberately or not, both confirmed by generating a
sample script for
[`openapi-to-k6/simple_post_request_schema.json`](openapi-to-k6/simple_post_request_schema.json):

- **Every `schema.example` is wrapped in quotes as a plain string, regardless of the
  schema's actual type.** An integer property with `example: 25` comes out as the
  string `"25"`, a boolean with `example: true` comes out as `"true"`, and an array
  with `example: ["tag1", "tag2"]` comes out as the string `"tag1,tag2"` (the array's
  own `.toString()`, then quoted). None of these match the type the generated client
  actually expects for that field.
- **Once a required object (such as a request body) is being filled in, every one of
  its properties is filled in recursively, not just its required ones.** The
  "required parameters only" rule above is about which top-level arguments get a
  value at all, not about which nested fields inside an object value get one; an
  object's optional fields are populated the same as its required ones once that
  object itself is being generated.

Concretely, for a body schema with required `name`/`age`/`isActive` and optional
`tags`/`date`/`meta`, the generated sample includes all six fields, and the ones with
non-string schema types come out wrong:

```ts
createExampleDataBody = {
  name: "John Doe",
  age: "25", // schema type is integer
  isActive: "true", // schema type is boolean
  tags: "tag1,tag2", // schema type is array, and not required
  date: "2024-01-01",
  meta: { createdBy: "John Doe", updatedBy: "Jane Doe" }, // not required
};
```

In `tags` mode, the sample script creates one client instance per tag and calls each
tag's methods on its own instance.

## 10. Two already-known-and-worked-around orval issues

These are not part of `openapi-to-k6`'s own design, they are patches over existing
`orval` behavior, kept here because a Go rewrite will hit the same underlying spec
edge cases even if it does not reuse `orval`:

- **Empty files from tag filtering.** When `--only-tags` filters out every operation
  in a file, `orval` still writes that file with just the header comment. `orval`'s
  own issue tracker has this open as
  [orval-labs/orval#1691](https://github.com/orval-labs/orval/issues/1691).
  `openapi-to-k6` detects and deletes these header-only files after the fact
  ([generator/index.ts, lines 44 to 59](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/index.ts#L44-L59)).
- **`Blob` is not a real type in k6.** `orval`'s own type mapping produces `Blob` for
  binary-format schemas (section 4), but k6 has no `Blob` global. `openapi-to-k6`
  rewrites every occurrence of the word `Blob` in the generated file text to
  `ArrayBuffer`
  ([generator/index.ts, lines 61 to 65](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/generator/index.ts#L61-L65)).

See [`COMPAT.md`](COMPAT.md) for bugs that are **not** worked around yet (the
dot-in-output-path bug, the silent-failure exit code, and the OpenAPI 3.2 `QUERY`
method gap). Do not treat any of those as a rule to replicate; they are defects, and
`COMPAT.md` explains each one's exact cause.
