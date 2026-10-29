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

The OpenAPI documentation is served by the Nest application on the port after the Strapi port. With the default local setup, it is available at:

http://localhost:1338/api/docs

#### 8. Tests

Run the tests using:

```shell
npm run test
```

##### Test Structure

Place each test file next to the class it tests. Use the class name followed by `.test.ts`: for example, `AuthController.ts` is tested in `AuthController.test.ts`.

Each test covers one aspect and is declared explicitly. Do not generate tests using loops. Use descriptive test names without repeating information already provided by the surrounding suites.

Divide each test into these phases, using the comments exactly as shown:

- `// given`: Prepare the input and required test data. E2E tests may use public `E2ETestManager` helpers here, including registration, login, and project or room creation. Assertions may verify that the preparation succeeded. Omit this comment when no preparation is needed.
- `// when`: Perform the operation being tested. In E2E tests, call the API directly with `fetch`; do not hide the tested request behind a manager helper.
- `// then`: Only inspect and assert the results. Reading the response body and validating its schema belong here. Do not create data, change application state, or make additional API requests in this phase.

E2E tests must create their own required data in the `given` phase and clean it up after the test. Do not depend on data created by another test or on test execution order. The manager registers only the administrator when starting an instance; its data creation helpers register cleanup hooks for test data.

For E2E tests, nest `describe` suites by **path → HTTP method → status code**. Split nested paths into separate suites where appropriate. Use lowercase HTTP method names and the status code alone as the status suite title. The individual test title describes the behavior without a status-code prefix:

```ts
describe('/system', (): void => {
  describe('/version', (): void => {
    describe('get', (): void => {
      describe('200', (): void => {
        test('version without authentication', async (): Promise<void> => {
          // when
          // Call GET /system/version directly.
          // then
          // Assert the status and returned version.
        });
      });
    });
  });
});
```

For unit tests, nest `describe` suites by **class → method → aspect**. The individual test title describes a specific case within that aspect:

```ts
describe('ExampleService', (): void => {
  describe('parse', (): void => {
    test('rejects an empty string', (): void => {
      // given
      // Prepare the service and input.
      // when
      // Call the method being tested.
      // then
      // Assert the result or captured error.
    });
  });
});
```

### Before committing

Run the pre-commit checks before committing changes:

```shell
npm run pre-commit
```
