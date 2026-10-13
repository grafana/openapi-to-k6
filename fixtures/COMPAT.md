# OpenAPI Spec Compatibility

Empirical findings from running `openapi-to-k6` (v0.4.1, via `npm run dev`) against the
sample specs in [`openapi-org/`](openapi-org/). Each sample was run in both its `.json`
and `.yaml` form where available. Provenance for each file (source repo and path) is
tracked in [`openapi-org/ORIGIN.json`](openapi-org/ORIGIN.json) rather than inline in
the specs, so the fixtures stay byte-identical to upstream.

`openapi-to-k6` does no spec parsing of its own: it forwards the input file straight to
[`orval`](https://orval.dev/) (`src/generator/index.ts`), which in turn uses
`@apidevtools/swagger-parser` (v12.1.0) to validate/bundle the document and
`swagger2openapi` to upgrade Swagger 2.0 documents to OpenAPI 3 before generation.
Whether a given spec shape parses and generates at all (the Swagger 2.0, 3.0/3.1,
and 3.2 findings below) is really orval/swagger-parser's compatibility, inherited
as-is.
The two general caveats right below this are not both from the same place, though:
the silent-failure/always-exit-0 behavior is `openapi-to-k6`'s own CLI wrapper
(it catches the error and never sets a non-zero exit code), while the dot-in-path
bug is inherited from orval itself. Each caveat's root cause section says which.

## ⚠️ General caveat: failures are silent

The CLI **always exits with code 0**, even when generation fails completely. A failure
looks like this on stdout, with no non-zero exit code to detect it in a script:

```
No files were generated. Try running with --verbose flag to get more details.
```

The real error (a stack trace or a parser warning) is only printed with `--verbose`.
Any automation calling this tool must grep stdout for `No files were generated`
rather than relying on the exit code.

This one is `openapi-to-k6`'s own doing, not orval's: its CLI catches the error
from generation and only logs it, it never calls `process.exit` with a non-zero
code
([`src/cli.ts`, lines 122 to 138](https://github.com/grafana/openapi-to-k6/blob/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/src/cli.ts#L122-L138)).

## ⚠️ General caveat: a dot in the output path breaks generation

Unrelated to spec version: if the output directory's last path segment contains a
dot (e.g. `out.dir`, or any name embedding a version number like `3.2-tags-example`),
the CLI misreads it as a single output *file* instead of a directory. It still writes
something at that exact path, but as one raw, unformatted file, and logs a formatting
error while still claiming success:

```
[ERROR] Error in formatting file <path>: UndefinedParserError: No parser could be
inferred for file "<path>".
🎉 <Title> - Your OpenAPI spec has been converted into ready to use orval!
TypeScript client generated successfully.
```

Reproduces with any spec, e.g. `openapi-to-k6 openapi-org/petstore.json out.dir`.
**Workaround**: never pass an output directory whose name contains a dot.

Root cause: orval decides whether a given output path is a directory or a file with
one check, whether the path has a file extension
([`packages/core/src/utils/assertion.ts`, line 15](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/utils/assertion.ts#L15),
used by
[`packages/core/src/utils/file.ts`, line 14](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/utils/file.ts#L14)).
Any dot after the last slash counts as an extension to that check, even one that is
really part of a version number like `3.2-tags-example`.

## Swagger 2.0 (`swagger: "2.0"`)

**Single-file specs: fully supported.** `petstore-minimal`, `petstore-simple`,
`petstore-with-external-docs`, `uber` (JSON and YAML) all generate a working client.
Internally, `@orval/core` detects `swagger: "2.0"` and runs `swagger2openapi` to
convert the document to OpenAPI 3 before generation, so this is not native 2.0 support,
but it works transparently.

**Multi-file specs: partially supported, with a silent crash.** `petstore-separate`
splits the spec across files via relative `$ref`s (`parameters.yaml#/tagsParam`,
`Pet.yaml`, `NewPet.yaml`, `../common/Error.yaml`), resolved from a local file path
(no URL needed) by `swagger-parser.resolve()`.

- Cross-file `$ref`s into plain **schema/definition** fragments (`Pet.yaml`,
  `NewPet.yaml`, `../common/Error.yaml`) resolve and convert correctly.
- Cross-file `$ref`s into a **parameters** fragment (`parameters.yaml#/tagsParam`)
  break generation. Root cause: orval's Swagger 2.0 to OpenAPI 3 conversion runs once
  per resolved file, and only converts a file whose own root object has
  `swagger: "2.0"`
  ([`packages/core/src/utils/open-api-converter.ts`, line 14](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/utils/open-api-converter.ts#L14),
  called once per file at
  [`packages/orval/src/import-open-api.ts`, line 75](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/orval/src/import-open-api.ts#L75)).
  A parameters fragment file like `parameters.yaml` is just a bare object of
  parameter definitions, with no `swagger` field of its own, so it is never
  converted and keeps its Swagger 2.0 shape (`type`/`collectionFormat` instead of
  `schema`/`content`) no matter which file it lives in. Orval's query-params getter
  then crashes on that unconverted shape:

  ```
  TypeError: Cannot read properties of undefined (reading 'application/json')
      at @orval/core/src/getters/query-params.ts:48
  ```

  ([exact line, pinned](https://github.com/orval-labs/orval/blob/a28fe2e1844ea55912a11b15c8e9eed040139280/packages/core/src/getters/query-params.ts#L48))

  This throws internally but is swallowed by the CLI, surfacing only as
  `No files were generated` (see caveat above) unless run with `--verbose`.
- **Workaround**: keep `parameters` objects inline in the main spec file even when
  other schemas are split into separate files.

## OpenAPI 3.0 and 3.1

**Fully supported, with one caveat.** Every 3.0 sample (`api-with-examples`,
`callback-example`, `link-example`, `petstore-expanded`, `petstore`, `uspto`) and every
3.1 sample (`non-oauth-scopes`, `tictactoe`, `webhook-example`), in both JSON and YAML,
generated without errors or warnings. `webhook-example` is the exception worth
flagging: it is a webhooks-only document with no `paths` at all, so what it actually
generates is just the `Pet` schema as an interface, no client class and no methods
(see
[`openapi-org/generated/webhook-example.ts`](openapi-org/generated/webhook-example.ts)).
"No errors" is not the same as "a working client" here; `openapi-to-k6` has no
support for the `webhooks` keyword, it just happens not to crash on a document that
only contains one.

**Multi-file OpenAPI 3.x specs: schemas work, parameters don't.** All of the samples
above are single-file. Testing a small multi-file OpenAPI 3.0 spec (a main document
with a cross-file `$ref` to a schema in one file and to a named parameter in another)
found a split result:

- A cross-file `$ref` to a **schema** resolves and generates correctly (a normal,
  correctly-named interface).
- A cross-file `$ref` to a **parameter** does not. The referenced type gets generated
  under a generic fallback name (`Schema`) while the place that uses it references a
  different name derived from the ref path (for example `LimitParam`) that was never
  actually defined, so the generated file fails to compile at all:
  ```
  error TS2304: Cannot find name 'LimitParam'.
  ```
  This is specific to *cross-file* parameter refs: the same named-parameter pattern
  (`$ref: '#/components/parameters/limitParam'`) works fine, correctly and
  consistently named, when it points within the same file.

## OpenAPI 3.2

**Not supported.** `@apidevtools/swagger-parser` 12.1.0 only validates up to OpenAPI
3.1.x, so any 3.2 document logs:

```
⚠️  SyntaxError: Unsupported OpenAPI version: 3.2.0. Swagger Parser only supports
    versions 3.1.0, 3.1.1, 3.1.2, 3.0.0, 3.0.1, 3.0.2, 3.0.3, 3.0.4
```

This is a warning, not a hard stop, so generation continues best-effort against the
document as if it were 3.1, with mixed results depending on which 3.2 feature is used:

- `3.2-tags-example` uses ordinary operation-level `tags` arrays (unchanged since
  3.0) together with OpenAPI 3.2's enhanced top-level Tag Object, which adds
  `summary`, `parent`, and `kind` fields to each tag definition (`externalDocs` on a
  tag is not new, it was already part of the Tag Object in 3.0). It generates
  without any further errors, because orval reads the operation `tags` array (as it
  always has) and simply ignores the new top-level Tag Object fields. The output
  client is correct but carries no trace of the new tag metadata (no tag hierarchy,
  no `kind`, no `summary`).
- `3.2-query-example` uses the new OpenAPI 3.2 HTTP `QUERY` method
  (`paths./flights/search.query`, a new sibling of `get`/`post`/etc.). Orval doesn't
  recognize `query` as an operation verb, so it silently generates zero operations,
  producing an empty output file that then gets deleted by orval's
  "remove empty files" step, resulting in `No files were generated` with **no error
  at all**, not even in `--verbose` mode. This is the least discoverable failure mode
  found in this survey.

## openapi-to-k6's own fixtures

[`openapi-to-k6/`](openapi-to-k6/) holds the schema fixtures already used inside this
repo's own `examples/` folder (one per generator feature being demonstrated: basic
schema, form data, form-url-encoded data, headers, query params, path params, no-title
schema, etc.), copied and renamed to `<original-folder-name>.json`. Unlike the
`openapi-org/` set, these aren't meant to test spec-version coverage; they exercise
specific generator code paths (parameter styles, request body encodings, missing
`info.title`, etc.) that the project's own examples were built to demonstrate.

All ten are OpenAPI 3.0.x (`3.0.0` or `3.0.3`) and all generate successfully, which is
expected since they're this tool's own working examples, not edge cases collected from
elsewhere.

## Generated reference output

Both `openapi-org/generated/` and `openapi-to-k6/generated/` hold the actual output of
running `openapi-to-k6` (`--mode single`, the default) against every fixture that
successfully produces output: the real generated `.ts` file, byte-for-byte as written
by the tool (renamed to `<fixture-name>.ts`), plus a `<fixture-name>.d.ts` extracted
from it with `tsc --emitDeclarationOnly` for a quick, implementation-free look at the
generated API surface (exported types, and class method signatures where there is a
client class at all; see the `webhook-example` caveat above for the one fixture that
produces only types and no client).

Two fixtures produce no output at all and so have nothing under `generated/`:
`petstore-separate` and `3.2-query-example` (see above for why).

This snapshot is tied to `openapi-to-k6` v0.4.1 and its current dependencies; it will
drift from reality after any upgrade to `orval`, `swagger-parser`, or the formatter,
and would need regenerating at that point.

## Summary

| Version | Single-file | Multi-file | Notes |
|---|---|---|---|
| Swagger 2.0 | ✅ | ⚠️ | Multi-file breaks if `parameters` are split into their own file |
| OpenAPI 3.0 | ✅ | ⚠️ | Multi-file breaks the same way: cross-file schema refs work, cross-file parameter refs don't compile |
| OpenAPI 3.1 | ✅ | n/a | Not tested for multi-file; likely the same as 3.0 given the shared code path, not confirmed |
| OpenAPI 3.2 | ❌ | n/a | Unsupported by the underlying parser; new `QUERY` method silently drops all operations |

Effective range supported today: **Swagger 2.0 through OpenAPI 3.1**, with the
multi-file caveats above for Swagger 2.0 and OpenAPI 3.0.
