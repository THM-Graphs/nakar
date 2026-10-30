import { E2ETestApplicationProject } from './E2ETestApplicationProject';
import { E2ETestApplicationRoom } from './E2ETestApplicationRoom';
import type { RoomVisibilityDto } from '../lib/schema/dtos/RoomVisibilityDto';
import type { PostAuthResponseBodyDto } from '../lib/http/routes/auth/dto/PostAuthResponseBodyDto';
import assert from 'node:assert/strict';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { SuiteContext, TestContext } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';
import testConfig from '../../node.config.json';
import { E2ETestApplicationContext } from './E2ETestApplicationContext';
import { E2ETestApplicationUser } from './E2ETestApplicationUser';
import { E2ETestApplicationAdmin } from './E2ETestApplicationAdmin';
import z from 'zod';

interface E2ETestApplicationPorts {
  strapiPort: number;
  apiPort: number;
}

export class E2ETestManager {
  private readonly _portSchema: z.ZodType<number> = z
    .string()
    .regex(/^\d+$/u)
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535));
  private readonly _applicationStartedSchema: z.ZodType<{
    type: 'application_did_start';
    metaData: E2ETestApplicationPorts;
  }> = z.object({
    type: z.literal('application_did_start'),
    metaData: z.object({
      strapiPort: this._portSchema,
      apiPort: this._portSchema,
    }),
  });

  private _process: ChildProcessWithoutNullStreams | null = null;
  private _processError: Error | null = null;
  private _logs: string = '';
  private _directory: string | null = null;

  private _context: E2ETestApplicationContext | null = null;

  public get context(): E2ETestApplicationContext {
    assert.ok(this._context, 'Application has not been started.');
    return this._context;
  }

  public get apiUrl(): string {
    return `http://127.0.0.1:${this.context.nestJsPort.toString()}/api`;
  }

  public get strapiUrl(): string {
    return `http://127.0.0.1:${this.context.strapiPort.toString()}`;
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
      // Isolate writable test data while sharing the application's built code.
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
      const jwtSecret: string = randomUUID();
      const env: NodeJS.ProcessEnv = {
        NODE_ENV: 'test',
        AUTH_RATE_LIMIT_ENABLED: 'false',
        ENV_PATH: join(directory, '.env'),
        HOST: '127.0.0.1',
        STRAPI_PORT: '0',
        API_PORT: '0',
        URL: 'http://127.0.0.1:0',
        ALLOWED_ORIGINS: 'http://localhost:5173',
        DATABASE_CLIENT: 'sqlite',
        DATABASE_FILENAME: join(directory, 'database.sqlite'),
        PUBLIC_DIR: join(directory, 'public'),
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
          cwd: resolve('.'),
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

      const ports: E2ETestApplicationPorts =
        await this._waitUntilOnline(signal);

      testContext.diagnostic(
        `Instance online. Strapi Port: ${ports.strapiPort}, API Port: ${ports.apiPort}`,
      );

      signal.throwIfAborted();
      testContext.diagnostic('Will register administrator.');
      const admin: E2ETestApplicationAdmin = await this._createAdmin(
        signal,
        ports.strapiPort,
      );
      signal.throwIfAborted();
      this._context = new E2ETestApplicationContext(
        admin,
        ports.strapiPort,
        ports.apiPort,
        ports.apiPort,
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

  public async registerUser(
    username: string,
    password: string,
    testContext: TestContext,
  ): Promise<E2ETestApplicationUser> {
    const response: Response = await fetch(
      `${this.strapiUrl}/api/auth/local/register`,
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
    const json: unknown = await response.json();
    assert.equal(response.status, 200, JSON.stringify(json));
    const body: { user: { documentId: string } } = z
      .object({ user: z.object({ documentId: z.string() }) })
      .parse(json);
    return new E2ETestApplicationUser(username, password, body.user.documentId);
  }

  public async loginUser(
    username: string,
    password: string,
    testContext: TestContext,
  ): Promise<PostAuthResponseBodyDto> {
    const response: Response = await fetch(`${this.apiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: testContext.signal,
    });
    const json: unknown = await response.json();
    assert.equal(response.status, 201, JSON.stringify(json));
    return z
      .strictObject({ username: z.literal(username), jwt: z.string().min(1) })
      .parse(json);
  }

  public async createProject(
    title: string,
    owner: E2ETestApplicationUser,
    collaborators: E2ETestApplicationUser[],
    testContext: TestContext,
  ): Promise<E2ETestApplicationProject> {
    const documentId: string = await this._createPublishedDocument(
      'api::project.project',
      {
        title,
        owner: owner.documentId,
        collaborators: collaborators.map(
          (user: E2ETestApplicationUser): string => user.documentId,
        ),
      },
      testContext,
    );
    return new E2ETestApplicationProject(documentId, title);
  }

  public async createRoom(
    title: string,
    visibility: RoomVisibilityDto,
    project: E2ETestApplicationProject,
    testContext: TestContext,
  ): Promise<E2ETestApplicationRoom> {
    const documentId: string = await this._createPublishedDocument(
      'api::room.room',
      { title, visibility, project: project.documentId },
      testContext,
    );
    return new E2ETestApplicationRoom(documentId, title, visibility);
  }

  private async _createPublishedDocument(
    model: 'api::project.project' | 'api::room.room',
    data: Record<string, unknown>,
    testContext: TestContext,
  ): Promise<string> {
    const response: Response = await fetch(
      `${this.strapiUrl}/content-manager/collection-types/${model}/actions/publish`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.context.admin.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: testContext.signal,
      },
    );
    const json: unknown = await response.json();
    assert.equal(response.status, 200, JSON.stringify(json));
    const body: { data: { documentId: string } } = z
      .object({ data: z.object({ documentId: z.string().min(1) }) })
      .parse(json);
    return body.data.documentId;
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

  private _getApplicationPortsFromLogs(
    logs: string,
  ): E2ETestApplicationPorts | null {
    for (const line of logs.split('\n')) {
      const jsonStart: number = line.indexOf('{');
      if (jsonStart === -1) {
        continue;
      }
      let json: unknown;
      try {
        json = JSON.parse(
          stripVTControlCharacters(line.slice(jsonStart)).trim(),
        );
      } catch (error: unknown) {
        if (error instanceof SyntaxError) {
          // Ignore unrelated output and incomplete JSON from split stream chunks.
          continue;
        }
        throw error;
      }
      const result: z.ZodSafeParseResult<{
        type: 'application_did_start';
        metaData: E2ETestApplicationPorts;
      }> = this._applicationStartedSchema.safeParse(json);
      if (result.success) {
        return result.data.metaData;
      }
    }
    return null;
  }

  private async _waitUntilOnline(
    signal: AbortSignal,
  ): Promise<E2ETestApplicationPorts> {
    let ports: E2ETestApplicationPorts | null;
    for (;;) {
      signal.throwIfAborted();
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
      ports = this._getApplicationPortsFromLogs(this._logs);
      if (ports == null) {
        await delay(100, undefined, { signal });
        continue;
      }
      const health: Response = await fetch(
        `http://127.0.0.1:${ports.strapiPort.toString()}/_health`,
        { signal },
      );
      await health.body?.cancel();
      assert.equal(
        health.status,
        204,
        'Strapi /_health returned an unexpected status after application_did_start.',
      );
      const version: Response = await fetch(
        `http://127.0.0.1:${ports.apiPort.toString()}/api/system/version`,
        { signal },
      );
      await version.body?.cancel();
      assert.equal(
        version.status,
        200,
        'NestJS /api/system/version returned an unexpected status after application_did_start.',
      );
      return ports;
    }
  }
}
