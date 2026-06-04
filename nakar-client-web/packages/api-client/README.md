# api-client

This package generates the HTTP API client used by `nakar-client-web`.

## Generate the client after API changes in nakar-server

If the HTTP API in `nakar-server` changes, regenerate the client from the updated OpenAPI definition.

> Warning: Do not edit files in `src-gen`. They are generated and will be overwritten.

1. Start `nakar-server`.
2. Run:

```shell
npm run generate
```
