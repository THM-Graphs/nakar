import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
   input: './src/openapi.yaml',
  output: './src-gen/open-api-client',
});
