import assert from 'node:assert/strict';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import type { AddressInfo, Server } from 'node:net';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { SuiteContext, TestContext } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import testConfig from '../../node.test.config.json';
import { E2ETestApplicationContextWithData } from './E2ETestApplicationContextWithData';
import { E2ETestApplicationUser } from './E2ETestApplicationUser';
import { E2ETestApplicationAdmin } from './E2ETestApplicationAdmin';
import z from 'zod';

export class E2ETestManager {
  private _process: ChildProcessWithoutNullStreams | null = null;
  private _processError: Error | null = null;
  private _logs: string = '';
  private _directory: string | null = null;

  private _context: E2ETestApplicationContextWithData | null = null;

  public get context(): E2ETestApplicationContextWithData {
    assert.ok(this._context, 'Application has not been started.');
    return this._context;
  }

  public async createAndStartApp(
    testContext: SuiteContext | TestContext,
  ): Promise<void> {
    const signal: AbortSignal = AbortSignal.any([
      testContext.signal,
      AbortSignal.timeout(testConfig.test['test-timeout']),
    ]);
    signal.throwIfAborted();
    testContext.diagnostic('Will create testable application instance.');

    assert.equal(
      this._directory,
      null,
      'This manager already started an application.',
    );
    try {
      await access(resolve('dist/src/index.js'));
    } catch (error: unknown) {
      throw new Error(
        'Build the server with npm run build before running E2E tests.',
        { cause: error },
      );
    }

    signal.throwIfAborted();
    const directory: string = await mkdtemp(
      join(tmpdir(), 'nakar-server-e2e-'),
    );
    this._directory = directory;

    try {
      signal.throwIfAborted();
      // Keep configuration and writable application paths separate from the checkout.
      await cp(resolve('dist/config'), join(directory, 'config'), {
        recursive: true,
      });
      signal.throwIfAborted();
      await copyFile(resolve('package.json'), join(directory, 'package.json'));
      signal.throwIfAborted();
      await copyFile(resolve('favicon.ico'), join(directory, 'favicon.ico'));
      signal.throwIfAborted();
      const linkType: 'junction' | 'dir' =
        process.platform === 'win32' ? 'junction' : 'dir';
      await symlink(
        resolve('node_modules'),
        join(directory, 'node_modules'),
        linkType,
      );
      signal.throwIfAborted();
      await symlink(resolve('dist/src'), join(directory, 'src'), linkType);
      signal.throwIfAborted();
      await mkdir(join(directory, 'public', 'uploads'), { recursive: true });
      signal.throwIfAborted();
      await writeFile(join(directory, '.env'), '');
      signal.throwIfAborted();
      await writeFile(
        join(directory, 'encryption_keys.json'),
        JSON.stringify({
          currentKeyId: 'test',
          keys: { test: randomUUID() },
        }),
      );

      signal.throwIfAborted();
      const strapiPort: number = await this._findPortPair();
      const jwtSecret: string = randomUUID();
      const env: NodeJS.ProcessEnv = {
        NODE_ENV: 'test',
        ENV_PATH: join(directory, '.env'),
        HOST: '127.0.0.1',
        PORT: String(strapiPort),
        URL: `http://127.0.0.1:${strapiPort.toString()}`,
        ALLOWED_ORIGINS: 'http://localhost:5173',
        DATABASE_CLIENT: 'sqlite',
        DATABASE_FILENAME: join(directory, 'database.sqlite'),
        ENCRYPTION_KEYS_PATH: join(directory, 'encryption_keys.json'),
        APP_KEYS: `${randomUUID()},${randomUUID()}`,
        API_TOKEN_SALT: randomUUID(),
        ADMIN_JWT_SECRET: randomUUID(),
        TRANSFER_TOKEN_SALT: randomUUID(),
        JWT_SECRET: jwtSecret,
        STRAPI_TELEMETRY_DISABLED: 'true',
      };
      testContext.diagnostic(JSON.stringify(env));
      signal.throwIfAborted();
      const child: ChildProcessWithoutNullStreams = spawn(
        process.execPath,
        [resolve('node_modules/@strapi/strapi/bin/strapi.js'), 'start'],
        {
          cwd: directory,
          env: {
            ...process.env,
            ...env,
          },
        },
      );
      this._process = child;
      child.on('error', (error: Error): void => {
        this._processError = error;
      });
      child.stdout.on('data', (data: Buffer): void => {
        this._logs += data.toString();
      });
      child.stderr.on('data', (data: Buffer): void => {
        this._logs += data.toString();
      });

      await this._waitUntilOnline(signal, strapiPort);
      signal.throwIfAborted();
      testContext.diagnostic('Will create demo data.');
      const primaryUser: E2ETestApplicationUser = await this._createUser(
        signal,
        strapiPort,
      );
      signal.throwIfAborted();
      const secondaryUser: E2ETestApplicationUser = await this._createUser(
        signal,
        strapiPort,
      );
      signal.throwIfAborted();
      const admin: E2ETestApplicationAdmin = await this._createAdmin(
        signal,
        strapiPort,
      );
      signal.throwIfAborted();
      this._context = new E2ETestApplicationContextWithData(
        primaryUser,
        secondaryUser,
        admin,
        strapiPort,
        strapiPort + 1,
        strapiPort + 1,
        jwtSecret,
      );
    } catch (error: unknown) {
      await this.destroy(testContext);
      throw error;
    }
  }

  public async destroy(testContext: SuiteContext | TestContext): Promise<void> {
    testContext.diagnostic('Will destroy testable application instance.');
    const child: ChildProcessWithoutNullStreams | null = this._process;
    try {
      if (
        child?.pid != null &&
        child.exitCode == null &&
        child.signalCode == null
      ) {
        const exited: Promise<unknown[]> = once(child, 'exit');
        const timeout: NodeJS.Timeout = setTimeout((): void => {
          child.kill('SIGKILL');
        }, 5000);
        try {
          child.kill('SIGTERM');
          await exited;
        } finally {
          clearTimeout(timeout);
        }
      }
    } finally {
      if (this._directory != null) {
        await rm(this._directory, { recursive: true, force: true });
      }
      this._process = null;
      this._directory = null;
      this._processError = null;
      this._logs = '';
      this._context = null;
    }
  }

  private async _createAdmin(
    signal: AbortSignal,
    strapiPort: number,
  ): Promise<E2ETestApplicationAdmin> {
    const email: string = `admin-${randomUUID()}@example.test`;
    const password: string = `Aa1-${randomUUID()}`;
    const response: Response = await fetch(
      `http://127.0.0.1:${strapiPort.toString()}/admin/register-admin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname: 'E2E', email, password }),
        signal,
      },
    );
    assert.equal(response.status, 200);
    const body: { data: { token: string } } = z
      .object({ data: z.object({ token: z.string().min(1) }) })
      .parse(await response.json());
    return new E2ETestApplicationAdmin(email, password, body.data.token);
  }

  private async _createUser(
    signal: AbortSignal,
    strapiPort: number,
  ): Promise<E2ETestApplicationUser> {
    const username: string = `e2e-${randomUUID()}`;
    const password: string = randomUUID();
    const response: Response = await fetch(
      `http://127.0.0.1:${strapiPort.toString()}/api/auth/local/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email: `${username}@example.test`,
        }),
        signal,
      },
    );
    assert.equal(response.status, 200, await response.text());
    return new E2ETestApplicationUser(username, password);
  }

  private async _findPortPair(): Promise<number> {
    for (let attempt: number = 0; attempt < 10; attempt++) {
      const strapiServer: Server = createServer();
      const nestServer: Server = createServer();
      try {
        await new Promise<void>(
          (accept: () => void, reject: (error: Error) => void): void => {
            strapiServer.once('error', reject);
            strapiServer.listen(0, '127.0.0.1', accept);
          },
        );
        const address: AddressInfo | string | null = strapiServer.address();
        assert.ok(address != null && typeof address !== 'string');

        // Check for highest valid TCP port
        if (address.port === 65535) {
          continue;
        }

        try {
          await new Promise<void>(
            (accept: () => void, reject: (error: Error) => void): void => {
              nestServer.once('error', reject);
              nestServer.listen(address.port + 1, '127.0.0.1', accept);
            },
          );
          return address.port;
        } catch (error: unknown) {
          if (!(
            error instanceof Error &&
            'code' in error &&
            error.code === 'EADDRINUSE'
          )) {
            throw error;
          }
        }
      } finally {
        await Promise.all([
          new Promise<void>((accept: () => void): void => {
            strapiServer.close((): void => {
              accept();
            });
          }),
          new Promise<void>((accept: () => void): void => {
            nestServer.close((): void => {
              accept();
            });
          }),
        ]);
      }
    }
    throw new Error(
      'Could not find two adjacent free ports for Strapi and NestJS.',
    );
  }

  private async _waitUntilOnline(
    signal: AbortSignal,
    strapiPort: number,
  ): Promise<void> {
    while (!signal.aborted) {
      if (
        this._processError != null ||
        this._process?.exitCode != null ||
        this._process?.signalCode != null
      ) {
        throw new Error(
          `E2E application exited before becoming ready.\n${this._logs}`,
          { cause: this._processError },
        );
      }
      try {
        const health: Response = await fetch(
          `http://127.0.0.1:${strapiPort.toString()}/_health`,
          { signal },
        );
        await health.body?.cancel();
        const version: Response = await fetch(
          `http://127.0.0.1:${(strapiPort + 1).toString()}/api/system/version`,
          { signal },
        );
        await version.body?.cancel();
        if (health.status === 204 && version.status === 200) {
          return;
        }
      } catch {
        signal.throwIfAborted();
        // Connections may be refused while the application is booting.
      }
      await delay(100, undefined, { signal });
    }
    signal.throwIfAborted();
  }
}
