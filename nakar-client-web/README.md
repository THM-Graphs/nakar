# Nakar Client (Web)

## Contribution Guide

### Setting up and starting the application

#### 1. Install the dependencies

```shell
npm ci
```

#### 2. Create the local environment file

The client reads its runtime configuration from `public/.env`. The example file is configured for the locally running API and WebSocket server.

```shell
cp .env.example public/.env
```

#### 3. Build the local `api-client` package

The web app depends on the generated client package in `packages/api-client`.

See [api-client](./packages/api-client/README.md).

#### 4. Start the development server

```shell
npm run dev
```

Open the URL shown in the terminal.

### Before committing

Run the repository checks before creating a commit:

```shell
npm run pre-commit
```
