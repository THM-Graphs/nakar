# Nakar Client (Web)

## Contribution Guide

### Starting and setting up the application

#### 1: Install node packages:
```shell
npm i
```

#### 2: Set environment variables:
The example environment file will configure the application to talk to the locally running server.
```shell
cp ".env.example" "public/.env"
```

#### 3: Start the live server:

```shell
npm run dev
```
Visit the displayed URL.

### Before commit

If you want to commit any changes, you should run the following commands beforehand:

```shell
npm run build
npm run lint:fix
npm run audit
```
