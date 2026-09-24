# Ideas for the Go rewrite

Ideas and bug fixes for a k6 subcommand rewrite of `openapi-to-k6` in Go, not
a formal spec. Everything here traces back to a bug, gap, or design choice
found while writing [`COMPAT.md`](COMPAT.md) and [`DIGEST.md`](DIGEST.md).
"Similar, not identical functionality" means each idea below is a real
choice, not something copied or fixed by default: it says what today's tool
does, and why that wasn't enough.

## New features

These are not gaps in current behavior, they are things the current tool does not
attempt at all:

- **A generated, type-safe, overridable factory per schema.** Today's
  sample-script Faker fallback is a one-off, internal-only helper: it only
  picks a value by basic JSON type, has real bugs (see below), and is not meant
  for anyone to use directly. The bigger idea is to generate a real factory for
  every schema, exported as normal public API, for a k6 script author to use
  for whatever they want (building test data for a scenario, a fuzz test,
  anything), not just for the tool's own demo script; the sample script (see
  below) is just one consumer of it among others. This applies whatever the
  factory's values actually come from (see
  the flavors below); these mechanics are settled regardless:

  - The factory is real, plain generated code (for example, one function per
    field on an object, such as `{ id: () => faker.number.int(), name: () =>
    faker.person.fullName() }`), so a user can override specific fields with
    plain code (subclassing, spread, whatever fits), in their own file. No
    addressing scheme is needed (JSON Pointer, name pattern, etc.), and the
    override survives the next regeneration.
  - Building a real `build(overrides)`-style call, common in factory libraries,
    that fakes every field except the ones passed in for one call, is worth
    doing deliberately rather than only supporting whole-factory replacement.
  - Nested objects should compose the nested schema's own factory (of the same
    flavor) rather than inlining its fields again; arrays need a decided
    default item count.
  - A single, parametrized flag, independent of today's
    `--include-sample-script`, controls this, matching how `--mode` already
    works (one flag, an enum value) rather than a growing pile of separate
    boolean flags. The flag's presence at all means "generate the factory's
    type-safe API," and its value says which concrete implementation(s), if
    any, to also generate on top of that: `api` generates only the interface,
    with no implementation at all, the user's own responsibility to supply
    one; `faker` additionally generates the faker-based implementation below;
    later flavors (`example`, a CSV/JSON source) would just be further allowed
    values. `api` alone is useful on its own (type safety, no implementation
    attached), and keeps the expensive part, a full implementation per
    field, something you opt into rather than get automatically.
  - Building this properly would also fix, by construction, the path-parameter
    cross-contamination bug listed below: a real factory keyed correctly by
    field cannot reuse the wrong parameter's value the way today's shared,
    unkeyed lookup does.

  **The `faker` flavor.** Each field's factory function calls an xk6-faker
  method chosen from the field's OpenAPI type/format (a `string, format:
  email` field calls `person.email()`, a plain string calls something
  generic, and so on). Dropped: a spec-level `x-faker` hint was considered
  but would just duplicate what real-code overrides already do.

  **The `example` flavor.** Reading values from the spec's own
  `example`/`examples` where present. Today's tool already tries this, ad
  hoc, and that is exactly why it has several of the bugs listed below;
  several real edge cases (how nested composition should work, what it even
  means for a schema with no examples anywhere) need a careful, deliberate
  design pass of their own.

  **The `csv` and `json` flavors.** A CSV or JSON file supplied by the user,
  pulling rows sequentially or at random instead of generating a new fake
  value each time. The same pattern generalized further (another value
  source, same shape, still overridable), useful for load tests that need to
  replay a real or pre-built dataset rather than synthetic fakes, a common
  need in k6 tests specifically.

- **One output per run; run the generator again for a different one.** Each
  invocation produces one coherent output; flags decide what's in it (the
  client, its types, a factory, a sample script, any combination). Wanting
  genuinely separate outputs, say the client and its types as two separate
  files, or the API client on its own and a factory on its own, means running
  the generator again with a different selection, not the tool understanding
  how to produce several distinct things in one pass. This replaces today's
  `--mode` concept for the two ways it currently tries to do more than that:

  - **`single` vs. `split` isn't a remaining question, it dissolves
    entirely.** Once every run produces exactly one file by construction,
    there's nothing left to ask, "one file or two" was only ever a question
    if a single run could produce more than one file, and this model rules
    that out from the start.
  - **`tags` mode is dropped, not carried over.** It was never a user
    request in the first place, added in a single commit
    ([`7d759b5`](https://github.com/grafana/openapi-to-k6/commit/7d759b538156d32ed16a8d978cd784e8d7b6500b),
    October 2024) with no linked issue. It has since caused real, traceable
    problems: it prompted a separate feature (`--only-tags`, filed as
    [issue #12](https://github.com/grafana/openapi-to-k6/issues/12)) just to
    soften how unwieldy it makes a large spec's output, and it has a real,
    still-open bug
    ([issue #29](https://github.com/grafana/openapi-to-k6/issues/29)) where
    an operation with more than one tag lands in only one tag's file while
    the sample script still
    assumes every tag got one, producing an import to a file that was never
    written. A similar practical result is still reachable without the mode:
    running the generator once per tag (using the existing tag filter)
    produces one self-contained file per tag, no shared file to keep
    consistent across runs, no multi-tag ambiguity, since each run is
    independent. The cost: some type duplication across per-tag files,
    accepted as a normal property of independently-generated files, not a
    bug to fix.

- **Authentication.** Today, `security` / `securitySchemes` generate nothing at
  all. The simple schemes (`apiKey`, and `http` with `basic` or `bearer`) should
  generate a typed constructor or method-level argument, since there is a known
  place to put the value (a header, query param, or cookie) for cheap, real
  value. `oauth2` and `openIdConnect` should not be modeled at all, acquiring a
  token is a different problem than shaping one request. Instead, a generic
  per-request auth callback (an optional function invoked before every
  request to inject or modify headers) should be the extension point for
  those, and for anything else. It runs fresh on every call, so it can pull
  a just-refreshed token instead of one fixed at construction time, and it
  also covers the simple schemes for anyone who wants full control instead
  of the generated argument.

- **Typed error bodies via a separate `error` field.** Today, error response
  schemas are computed but never surfaced; every method's `data` type comes
  only from the `2xx` responses, so a non-2xx response is still typed as if
  it were a success, even though the tool already knows its real schema. A
  separate, optional `error` field on the return value (typed from the
  non-2xx responses) fixes that without disturbing the success path: callers
  who don't care can ignore it, `data` stays exactly as simple as it is
  today. A fuller alternative, a discriminated union keyed on status, was
  considered and rejected here: it is more precise, but it forces every call
  site to narrow on `status` before touching `data` at all, more friction
  than fits a k6 load-test script's usual loose, iterative style.

- **Spec-correct parameter serialization (`style`, `explode`).** Today, path
  values are interpolated with no encoding at all, and query values go through
  whatever plain `URLSearchParams` does with the given JS value, with no support
  for OpenAPI's `style`/`explode` keywords (comma vs. repeated-key arrays,
  `deepObject`, and so on). The goal is spec-correct serialization, not just
  "good enough for typical APIs." On top of that, a raw/pass-through option is
  worth adding for when a value is already serialized (for example, a wrapper
  like `Raw("already-encoded-value")` that the serializer passes through
  untouched): it avoids double-encoding an already-correct value, and, since
  this is a load-testing tool, it also lets a script deliberately send a
  malformed or edge-case-encoded value to see how the server handles it.

- **`servers` support.** The OpenAPI `servers` field should be supported as
  the default base URL, with an optional `baseUrl` override, same as the
  original tool.

- **Factory-based sample script.** Today's version has its own ad hoc
  value-picking logic, and that is where all its bugs live. Rebuilt to call
  the `faker` factory for each required argument instead, most of those bugs
  disappear by construction; what's left is just enumerating operations and
  wiring up the calls.

- **Optional output usable as an HTTP-based jslib.** Today's generated client is
  meant to be imported as a local file inside one k6 project; it is never meant to
  be published and pulled in over HTTP the way k6 itself pulls in
  `https://jslib.k6.io/...` modules. Idea: an optional output shape (self-contained,
  no relative imports of other generated files) that could be hosted somewhere and
  imported by URL from any k6 script, the same way jslib modules are, so a
  generated client could be shared across projects without checking its files into
  each one.

## Bug fixes

These are not design choices, just broken. Worth confirming, then fixing, rather
than debating:

- **CLI never exits with a non-zero code on failure.** Every failure looks
  identical to success unless you grep stdout or pass `--verbose`. See
  `COMPAT.md`'s "failures are silent" caveat.
- **Response parsing guesses instead of using what's already known.** Today,
  every method calls `response.json()` and falls back to `response.body` if
  that throws, unconditionally, even for a response the generator already
  knows, statically, is not JSON (a `format: binary` response, for example,
  is guaranteed to throw there every single call). The generator already
  picks the `data` type from the declared response schema; it can just as
  easily pick the matching parsing call at the same time, `response.json()`
  for a JSON schema, `response.body` directly for anything else, no guessing,
  no wasted attempt, no `try`/`catch` needed at all.
- **Binary responses ignore a caller-supplied `responseType`.** A
  `format: binary` response hardcodes `responseType: 'binary'` on the request
  options, spread *after* the caller's own `Params`, so it always wins even
  though every other `Params` field (headers, cookies, tags) already works
  the other way, caller-supplied values winning over the default. `'binary'`
  stays the right default; the fix is just building the default and the
  caller's override in the right order (default first, caller's values
  spread on top), the same way the rest of `Params` already works, not a new
  mechanism.
- **Cross-file parameter refs in multi-file OpenAPI 3.x specs don't compile.**
  Confirmed with a small multi-file OpenAPI 3.0 spec: a cross-file `$ref` to a
  schema resolves and generates correctly, but a cross-file `$ref` to a named
  parameter generates the referenced type under a generic fallback name
  (`Schema`) while the place that uses it references a different name derived
  from the ref path (`LimitParam`, in the test case) that was never actually
  defined, so the file fails to compile (`Cannot find name 'LimitParam'`). The
  same named-parameter pattern works fine within a single file, so this is
  specific to the cross-file case. See `COMPAT.md`'s "Multi-file OpenAPI 3.x
  specs" note.
- **A dot in the output path is misread as a file instead of a directory.** This
  one lives in `orval`, not `openapi-to-k6`, so it only carries over if the Go
  rewrite's own output-path handling makes the same mistake; worth a test either
  way. See `COMPAT.md`'s "a dot in the output path" caveat.

## Implementation note

Everything above is about what the tool should do. This one is about how it could
be built, starting-point thinking for whoever writes it, not an open question in
the same sense as the rest of this file. Both items below (which templating
library, which spec-parsing library) are internal implementation choices; an end
user of the CLI would never see or care which one was picked, so neither belongs
in the "what the tool does" lists above:

- **Templating, and whatever data model feeds it, stay internal for now, not a
  public extension point.** Making templates end-user-pluggable (so anyone could
  supply their own, including a community-maintained legacy-compat one) would
  need a stable, documented, versioned "template data" contract, the actual data
  structure fed into templates. That has a real upfront cost (designing and
  freezing a public API before the tool's own internal design has even settled)
  and an ongoing one (every later internal change constrained by a promise never
  to break it). Not worth paying either cost before the tool exists: keep the
  templating engine and its data model an unexported implementation detail, and
  treat public template extensibility as a later decision, only once the tool's
  actual design has stabilized enough to be worth freezing part of it.

- **Templating: Go's standard library `text/template` is the preferred choice.**
  This is not meant to mirror the current JS tool's own architecture; the current
  tool mostly builds its main client output through plain functions returning JS
  template-literal strings, with no separate template engine at all, and only
  uses an actual templating engine (Handlebars) for the smaller, separate
  sample-script feature. So this is a preference for the Go rewrite on its own
  terms, not a carried-over pattern: `text/template` is the standard, dependency-free
  choice in Go for this kind of text generation, and it is also what
  `oapi-codegen` (the best-known Go OpenAPI-to-Go-client generator) uses.

- **Spec parsing: still an open choice, worth investigating more than one
  library.** A Go OpenAPI parsing/validation library is needed either way.
  `kin-openapi` (`github.com/getkin/kin-openapi`) is popular and reasonably
  flexible, and is what `oapi-codegen` uses, but it is not the only option worth
  looking at; `libopenapi` (`github.com/pb33f/libopenapi`) is a newer alternative
  some tools prefer specifically for more complete OpenAPI 3.1 handling. Whichever
  is picked, OpenAPI 3.2 support should be checked directly rather than assumed;
  given how recent 3.2 is, and that even `@apidevtools/swagger-parser` (used
  by `orval`, which the current JS tool wraps) does not support it yet (see
  `COMPAT.md`), it would not be surprising if no Go library supports it yet
  either.

