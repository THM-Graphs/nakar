# Nakar Server

## Contribution Guide

### Local setup

#### 1. Install dependencies

```shell
npm ci
```

#### 2. Create a local environment file

The example files configure the server to run locally.

```shell
cp .env.example .env
cp encryption_keys.example.json encryption_keys.json
```

#### 3. Start the server

For local development with hot reloading and the Content-Type Builder:

```shell
npm run develop
```

For a production-style startup without hot reloading:

```shell
npm run build
npm run start
```

#### 4. Create a local admin account

Open http://localhost:1337 and create a local admin account for your development environment.

> Tip: Use the following login data for the admin account:
>
> | Email          | Password             |
> | -------------- | -------------------- |
> | admin@nakar.de | seuzgfesuz3672tUZGZU |

#### 5. Configure role permissions

To allow login and access to the current user endpoint, update the Users & Permissions roles in the admin UI:

1. Open http://localhost:1337/admin/settings/users-permissions/roles.
2. Select **Public**.
3. Disable all permissions.
4. Enable **User-permissions -> Auth -> Callback**.
5. Go back and select **Authenticated**.
6. Disable all permissions.
7. Enable **User-permissions -> User -> me**.

#### 6. Import data (optional)

1. Stop the server.
1. Copy `./examples/export.tar` to `./export.tar`
1. Run `npm run import`.
1. Start the server.
1. Check the imported data at http://localhost:1337/admin/content-manager.
1. Create a user (if the demo data did not include one) at http://localhost:1337/admin/content-manager/collection-types/plugin::users-permissions.user.

#### 7. API documentation

The OpenAPI documentation is served by the Nest application on `API_PORT`.
With the local `.env.example` setup, it is available at:

http://localhost:1338/api/docs

## Updating an existing Docker Compose deployment

Use a server image built from this change. In your existing server service,
remove `PORT` from `environment` and any `env_file` passed to the container, and
set `STRAPI_PORT` and `API_PORT` explicitly (or omit both for defaults 80 and 81).
For example, merge these settings into your existing service, keeping its other
environment variables, secrets, volumes, and image configuration:

```yaml
services:
  server:
    environment:
      STRAPI_PORT: '80'
      API_PORT: '81'
    ports:
      - '1337:80'
      - '1338:81'
```

Compose port mappings use `HOST:CONTAINER`. This example publishes Strapi on host
port 1337 and the API/WebSockets on host port 1338. If your container previously
used `PORT=80`, its listener ports remain unchanged with these settings. If it
used a different port, either keep that value as `STRAPI_PORT` and set `API_PORT`
to its old value plus one, or update the container-side port mappings and reverse
proxy targets to match the new listener ports. The two new values may be chosen
independently. See the [Compose ports reference](https://docs.docker.com/reference/compose-file/services/#ports).

`URL`, `BACKEND_URL`, `BACKEND_SOCKET_URL`, and `ALLOWED_ORIGINS` only need changing
if their public endpoints/origins change. The image's healthcheck follows
`STRAPI_PORT`; update any custom Compose healthcheck that hardcodes another port.

For a published image, update its tag if needed, then run (replace `server` with
your actual service name):

```shell
docker compose pull server
docker compose up -d --no-deps server
docker compose ps server
docker compose logs --tail=100 server
```

If Compose builds your image locally instead, use
`docker compose up -d --build --no-deps server`. A plain `docker compose restart`
does not apply the changed container environment. `compose up` recreates the
service when its configuration or image changes and preserves mounted volumes;
see the [Compose up reference](https://docs.docker.com/reference/cli/docker/compose/up/).

## Before committing

Run the pre-commit checks before committing changes:

```shell
npm run pre-commit
```
