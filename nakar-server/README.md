# Nakar Server

## Contribution Guide

### Starting and setting up the server

#### 1: Install node packages:

```shell
npm i
```

#### 2: Set environment variables:

The example environment file will configure the server to run locally on localhost:1337.

```shell
cp ".env.example" ".env"
```

#### 3: Start the live server:

With hot-reloading and content-type builder:

```shell
npm run develop
```

Without hot-reloading:

```shell
npm run build
npm run start
```

#### 4: Set up a local admin account

Open http://localhost:1337 and create a local admin account.

Tip: Use the following login data for the admin account:

| Email          | Password             |
| -------------- | -------------------- |
| admin@nakar.de | seuzgfesuz3672tUZGZU |

#### 5: Enable the API endpoints to be accessible without authentication

1. Go to http://localhost:1337/admin/settings/users-permissions/roles
2. Select "Public"
3. Disable everything
4. Enable User-permissions -> Auth -> Callback
5. Go back and select "Authenticated"
6. Disable everything
7. Enable User-permissions -> User -> me

#### 6: Import data

1. Ask the maintainer for the "export.tar" file.
1. Copy the file into the root of this package.
1. Run `npm run import`.
1. Check imported data here: http://localhost:1337/admin/content-manager

#### 7. API Documentation

Visit: http://localhost:1338/api/docs for OpenAPI documentation.

### Before commit

If you want to commit any changes, you should run the following commands beforehand:

```shell
npm run pre-commit
```
