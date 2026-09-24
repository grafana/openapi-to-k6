# fixtures

OpenAPI/Swagger test fixtures, collected here to seed the test corpus for a
planned Go rewrite of `openapi-to-k6` (as a k6 subcommand extension).

- [`openapi-org/`](openapi-org/): the official OpenAPI example specs from
  [OAI/learn.openapis.org](https://github.com/OAI/learn.openapis.org),
  de-duplicated to one (the most recent) spec version per named example.
  Spans spec versions Swagger 2.0 through OpenAPI 3.2 (see `COMPAT.md` for
  which of those versions actually work with `openapi-to-k6`).
- [`openapi-to-k6/`](openapi-to-k6/): the schema fixtures already used by
  this repo's own `examples/` folder. Exercises specific generator code
  paths (parameter styles, request body encodings, a missing `info.title`,
  etc.) rather than spec-version coverage.

Each subfolder has its own `README.md` and `ORIGIN.json` recording exactly
where its files came from (source repo, path, and commit), since the input
specs themselves are kept byte-identical to their source with no injected
metadata. Each subfolder also has a `generated/` directory with the actual
`openapi-to-k6` output for its fixtures (client + a declaration-only
`.d.ts`), for reference; unlike the input specs, those files are tied to
the tool version that produced them.

See [`COMPAT.md`](COMPAT.md) for compatibility findings from running the
original JS `openapi-to-k6` against every fixture here, [`DIGEST.md`](DIGEST.md)
for a context extract of how that tool turns a spec into a client (naming
rules, type mapping, parameter handling, and so on), written for whoever
designs the Go rewrite, and [`IDEAS.md`](IDEAS.md) for the actual ideas and
bug fixes that came out of writing the two documents above.
