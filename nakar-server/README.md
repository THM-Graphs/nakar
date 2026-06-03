# Nakar Server

## Contribution Guide

### Local setup

#### 1. Install dependencies

```shell
npm ci
```

#### 2. Create a local environment file

The example file configures Strapi to run locally.

```shell
cp .env.example .env
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

#### 6. Import data

1. Copy `./examples/export.tar` to `./export.tar`
1. Run `npm run import`.
1. Check the imported data at http://localhost:1337/admin/content-manager.
1. Create a user (if the demo data did not include one) at http://localhost:1337/admin/content-manager/collection-types/plugin::users-permissions.user.

#### 7. API documentation

The OpenAPI documentation is served by the Nest application on the port after the Strapi port. With the default local setup, it is available at:

http://localhost:1338/api/docs

### Before committing

Run the pre-commit checks before committing changes:

```shell
npm run pre-commit
```
