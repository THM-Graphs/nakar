import { type Request, Router } from 'express';
import { HTTPTools } from '../HTTPTools';
import type { operations } from '../../../../src-gen/schema';
import * as undici from 'undici';
import { ConfigService } from '../../config/ConfigService';
import z from 'zod';
import { Unauthorized } from 'http-errors';

export class AuthenticationRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _config: ConfigService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.post('/', this._httpTools.handle(this._postAuth.bind(this)));
    router.get(
      '/',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._getAuth.bind(this)),
    );

    return router;
  }

  private async _postAuth(
    req: Request,
  ): Promise<
    operations['postAuth']['responses']['200']['content']['application/json']
  > {
    type Body =
      operations['postAuth']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body: Body = req.body as Body;

    const result: undici.Response = await undici.fetch(
      `http://localhost:${this._config.port}/api/auth/local`,
      {
        method: 'POST',
        body: JSON.stringify({
          identifier: body.username,
          password: body.password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const json: unknown = await result.json();
    // eslint-disable-next-line @typescript-eslint/typedef
    const responseType = z.object({
      jwt: z.string().optional(),
      user: z
        .object({
          documentId: z.string(),
          username: z.string(),
        })
        .optional(),
      error: z
        .object({
          status: z.number(),
          name: z.string(),
          message: z.string(),
        })
        .optional(),
    });
    const response: z.infer<typeof responseType> = responseType.parse(json);

    if (response.jwt == null || response.user == null) {
      throw new Unauthorized();
    }

    return {
      username: response.user.username,
      jwt: response.jwt,
    };
  }

  private async _getAuth(
    req: Request,
  ): Promise<
    operations['getAuth']['responses']['200']['content']['application/json']
  > {
    const jwt: string | null = this._httpTools.getJWT(req);
    if (jwt == null) {
      throw new Unauthorized();
    }

    const result: undici.Response = await undici.fetch(
      `http://localhost:${this._config.port}/api/users/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    );
    const json: unknown = await result.json();
    // eslint-disable-next-line @typescript-eslint/typedef
    const responseType = z.object({
      documentId: z.string().optional(),
      username: z.string().optional(),
      error: z
        .object({
          status: z.number(),
          name: z.string(),
          message: z.string(),
        })
        .optional(),
    });
    const response: z.infer<typeof responseType> = responseType.parse(json);

    if (response.username == null) {
      throw new Unauthorized();
    }

    return {
      username: response.username,
    };
  }
}
