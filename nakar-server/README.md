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

With hot-reloading:
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
|----------------|----------------------|
| admin@nakar.de | seuzgfesuz3672tUZGZU |

#### 5: Enable the API endpoints to be accessible without authentication

1. Go to http://localhost:1337/admin/settings/users-permissions/roles
1. Open up "Public"
1. Open up "Frontend"
1. Check "Select all"
1. Click "Save"

#### 6: Import data

1. Ask the maintainer for the "export.tar" file.
1. Copy the file into the root of this package.
1. Run `npm run import`.
1. Check imported data here: http://localhost:1337/admin/content-manager

### Before commit

If you want to commit any changes, you should run the following commands beforehand:

```shell
npm run build
npm run lint:fix
npm run audit
```
