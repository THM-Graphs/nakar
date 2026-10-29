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
import type { TestContext } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { E2ETestApplicationContext } from './E2ETestApplicationContext';
import { E2ETestApplicationContextWithData } from './E2ETestApplicationContextWithData';

export class E2ETestManager {
  private _process: ChildProcessWithoutNullStreams | null = null;
  private _processError: Error | null = null;
  private _logs: string = '';
  private _directory: string | null = null;

  public static async createAppAndData(
    testContext: TestContext,
  ): Promise<E2ETestApplicationContextWithData> {
    const manager: E2ETestManager = new E2ETestManager();
    testContext.after(async (): Promise<void> => {
      await manager.destroy(testContext);
    });
    const applicationContext: E2ETestApplicationContext =
      await manager.createAndBootApp(testContext);
    return await manager.createDemoData(testContext, applicationContext);
  }

  public async createAndBootApp(
    testContext: TestContext,
  ): Promise<E2ETestApplicationContext> {
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

    const directory: string = await mkdtemp(
      join(tmpdir(), 'nakar-server-e2e-'),
    );
    this._directory = directory;

    try {
      // Keep configuration and writable application paths separate from the checkout.
      await cp(resolve('dist/config'), join(directory, 'config'), {
        recursive: true,
      });
      await copyFile(resolve('package.json'), join(directory, 'package.json'));
      await copyFile(resolve('favicon.ico'), join(directory, 'favicon.ico'));
      const linkType: 'junction' | 'dir' =
        process.platform === 'win32' ? 'junction' : 'dir';
      await symlink(
        resolve('node_modules'),
        join(directory, 'node_modules'),
        linkType,
      );
      await symlink(resolve('dist/src'), join(directory, 'src'), linkType);
      await mkdir(join(directory, 'public', 'uploads'), { recursive: true });
      await writeFile(join(directory, '.env'), '');
      await writeFile(
        join(directory, 'encryption_keys.json'),
        JSON.stringify({
          currentKeyId: 'test',
          keys: { test: randomUUID() },
        }),
      );

      const strapiPort: number = await this._findPortPair();
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
        JWT_SECRET: randomUUID(),
        STRAPI_TELEMETRY_DISABLED: 'true',
      };
      testContext.diagnostic(JSON.stringify(env));
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

      await this._waitUntilOnline(testContext, strapiPort);
      return new E2ETestApplicationContext(
        strapiPort,
        strapiPort + 1,
        strapiPort + 1,
      );
    } catch (error: unknown) {
      await this.destroy(testContext);
      throw error;
    }
  }

  public async createDemoData(
    testContext: TestContext,
    context: E2ETestApplicationContext,
  ): Promise<E2ETestApplicationContextWithData> {
    const username: string = `e2e-${randomUUID()}`;
    const password: string = randomUUID();
    const response: Response = await fetch(
      `http://127.0.0.1:${context.strapiPort.toString()}/api/auth/local/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email: `${username}@example.test`,
        }),
        signal: testContext.signal,
      },
    );
    assert.equal(response.status, 200, await response.text());
    return new E2ETestApplicationContextWithData(username, password, context);
  }

  public async destroy(testContext: TestContext): Promise<void> {
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
    }
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
    testContext: TestContext,
    strapiPort: number,
  ): Promise<void> {
    const deadline: number = Date.now() + 60000;
    while (Date.now() < deadline) {
      testContext.signal.throwIfAborted();
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
          { signal: testContext.signal },
        );
        await health.body?.cancel();
        const version: Response = await fetch(
          `http://127.0.0.1:${(strapiPort + 1).toString()}/api/system/version`,
          { signal: testContext.signal },
        );
        await version.body?.cancel();
        if (health.status === 204 && version.status === 200) {
          return;
        }
      } catch {
        testContext.signal.throwIfAborted();
        // Connections may be refused while the application is booting.
      }
      await delay(100, undefined, { signal: testContext.signal });
    }
    throw new Error(
      `E2E application did not become ready within 60 seconds.\n${this._logs}`,
    );
  }
}
