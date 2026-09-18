# openapi-to-k6 fixtures

This folder holds the schema fixtures already used inside
[grafana/openapi-to-k6](https://github.com/grafana/openapi-to-k6)'s own
`examples/` directory, one per generator feature the project demonstrates
(basic schema, form data, form-url-encoded data, headers, query params, path
params, a schema with no `info.title`, etc.). Each was copied verbatim from
its `schema.json` and renamed to `<original-folder-name>.json`, with no other
modifications.

Unlike the `../openapi-org/` set, these don't test spec-version coverage;
they exercise specific generator code paths (parameter styles, request body
encodings, missing title, etc.) that this tool's own examples were built to
demonstrate. All provenance (source path and commit) is kept separately in
[`ORIGIN.json`](ORIGIN.json), not inside the spec files. To see the exact
upstream state these files were copied from, browse the source repo at the
pinned commit:
[github.com/grafana/openapi-to-k6/tree/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/examples](https://github.com/grafana/openapi-to-k6/tree/d2105fd0d3ffec8a0c5b9aa30bab1088eee56615/examples).

See [`../COMPAT.md`](../COMPAT.md) for compatibility findings from running
these fixtures through `openapi-to-k6`.
