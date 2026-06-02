# api-client

This package contains the generated HTTP API client used by `nakar-client-web`.

## Build the package

```shell
npm ci
npm run build
```

## Regenerate the client after API changes

If the HTTP API in `nakar-server` changes, regenerate the client from the updated OpenAPI definition.

> Warning: Do not edit files in `src-gen`. They are generated and will be overwritten.

1. Start `nakar-server`.
2. Run:

```shell
npm run export:api
npm run build
```
