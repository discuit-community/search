# search

a search api & interface for [discuit].

## how it works

this project provides a fast, filterable search api for discuit, using
[meilisearch] for full-text search and [elysia] for the api.

posts are fetched from discuit, stored in a local sqlite database, and indexed
by meilisearch. the api supports searching, filtering, sorting, and autocomplete.

## endpoints

- `GET /health`
  health check endpoint.

- `GET /search`
  search posts with filters and sorting.

  - query params:
    - `q`: search query
    - `community`: filter by community
    - `username`: filter by username
    - `type`: filter by post type
    - `sort`: sort by field (e.g. `createdAt desc`)
    - `limit`: number of results (max 100)
    - `offset`: pagination offset

- `GET /autocomplete`
  autocomplete post titles.

  - query params:
    - `q`: autocomplete query

the api is self-documenting via swagger at `/swagger`.

## development

requirements:

- [bun]
- [meilisearch]
- sqlite

setup:

1. fetch posts from discuit:
   ```
   bun run scripts/fetch.ts
   ```
2. start meilisearch (default: `http://127.0.0.1:7700`).
3. run the api server:
   ```
   bun run src/index.ts
   ```
4. visit `http://localhost:3001/swagger` for docs.

format, lint, and check code with:

```
bun run fmt
bun run lint
bun run check
```

## copying

this project is licensed under the gnu agplv3.0 license. you can find a copy of
the license in the [COPYING] file.

[meilisearch]: https://meilisearch.com/
[elysia]: https://elysiajs.com/
[discuit]: https://discuit.org/
[bun]: https://bun.sh/
