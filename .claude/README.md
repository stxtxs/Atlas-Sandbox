# .claude — docs for the product code in this repo

The product components here are copied from the Atlas client (`../client`). These
docs describe the conventions that code follows. How the tutorial itself works
(mock API, tours, coach) is in [../lib/sandbox/README.md](../lib/sandbox/README.md).

- [conventions.md](conventions.md) — imports, `qk` usage, form patterns, naming
- [data-fetching.md](data-fetching.md) — `qk` + SWR + `apiRequest` (all answered by `mockFetch`)
- [domain.md](domain.md) — business glossary
- [components/](components/) — shell, forms and UI primitives
- [skills/](skills/) — recipes: new page, SWR query, mutation, form
