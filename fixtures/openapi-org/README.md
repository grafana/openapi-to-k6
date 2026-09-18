# openapi-org fixtures

This folder holds a de-duplicated copy of the official OpenAPI example specs
published by the OpenAPI Initiative at
[OAI/learn.openapis.org](https://github.com/OAI/learn.openapis.org), under
its `examples/` directory. That repo publishes the same named example (e.g.
`petstore`) once per spec version it demonstrates (v2.0, v3.0, v3.1, v3.2);
here, only the most recent version of each named example was kept, so each
name appears exactly once, in `.json` and/or `.yaml` form.

Files are copied verbatim, byte-for-byte, with no modifications, renames, or
injected metadata, so they remain a faithful, unmodified test corpus. All
provenance (which upstream file each one came from, and at which commit) is
kept separately in [`ORIGIN.json`](ORIGIN.json), not inside the spec files.
To see the exact
upstream state these files were copied from, browse the source repo at the
pinned commit:
[github.com/OAI/learn.openapis.org/tree/43756549c27cbf84107b190b82c65e0336f2f09f/examples](https://github.com/OAI/learn.openapis.org/tree/43756549c27cbf84107b190b82c65e0336f2f09f/examples).

See [`../COMPAT.md`](../COMPAT.md) for compatibility findings from running
these fixtures through `openapi-to-k6`.
