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
All compatibility below is really orval/swagger-parser's compatibility, inherited as-is.

## ⚠️ General caveat: failures are silent

The CLI **always exits with code 0**, even when generation fails completely. A failure
looks like this on stdout, with no non-zero exit code to detect it in a script:

```
No files were generated. Try running with --verbose flag to get more details.
```

The real error (a stack trace or a parser warning) is only printed with `--verbose`.
Any automation calling this tool must grep stdout for `No files were generated`
rather than relying on the exit code.

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
  break generation. Root cause: `swagger2openapi` only converts the *main* document
  from Swagger 2.0 syntax to OpenAPI 3; a parameters fragment pulled in from another
  file keeps its Swagger 2.0 shape (`type`/`collectionFormat` instead of
  `schema`/`content`). Orval's query-params getter then crashes:

  ```
  TypeError: Cannot read properties of undefined (reading 'application/json')
      at @orval/core/src/getters/query-params.ts:48
  ```

  This throws internally but is swallowed by the CLI, surfacing only as
  `No files were generated` (see caveat above) unless run with `--verbose`.
- **Workaround**: keep `parameters` objects inline in the main spec file even when
  other schemas are split into separate files.

## OpenAPI 3.0 and 3.1

**Fully supported.** Every 3.0 sample (`api-with-examples`, `callback-example`,
`link-example`, `petstore-expanded`, `petstore`, `uspto`) and every 3.1 sample
(`non-oauth-scopes`, `tictactoe`, `webhook-example`), in both JSON and YAML, generated
a working client with no warnings.

## OpenAPI 3.2

**Not supported.** `@apidevtools/swagger-parser` 12.1.0 only validates up to OpenAPI
3.1.x, so any 3.2 document logs:

```
⚠️  SyntaxError: Unsupported OpenAPI version: 3.2.0. Swagger Parser only supports
    versions 3.1.0, 3.1.1, 3.1.2, 3.0.0, 3.0.1, 3.0.2, 3.0.3, 3.0.4
```

This is a warning, not a hard stop, so generation continues best-effort against the
document as if it were 3.1, with mixed results depending on which 3.2 feature is used:

- `3.2-tags-example` (path-item-level standalone tags) generates without any further
  errors, because it only adds metadata that orval simply ignores. The output client
  is correct but doesn't reflect the new tag structure.
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

## Summary

| Version | Single-file | Multi-file | Notes |
|---|---|---|---|
| Swagger 2.0 | ✅ | ⚠️ | Multi-file breaks if `parameters` are split into their own file |
| OpenAPI 3.0 | ✅ | n/a | Not tested (no multi-file 3.0 sample available) |
| OpenAPI 3.1 | ✅ | n/a | Not tested (no multi-file 3.1 sample available) |
| OpenAPI 3.2 | ❌ | n/a | Unsupported by the underlying parser; new `QUERY` method silently drops all operations |

Effective range supported today: **Swagger 2.0 through OpenAPI 3.1**, with the
multi-file caveat above for Swagger 2.0.
