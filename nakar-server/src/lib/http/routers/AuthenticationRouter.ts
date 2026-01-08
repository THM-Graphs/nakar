import { Request, Router } from 'express';
import { HTTPTools } from '../HTTPTools';
import { operations } from '../../../../src-gen/schema';
import * as undici from 'undici';
import z from 'zod';
import { Unauthorized } from 'http-errors';
import { getConfig } from '../../config/getConfig';

export class AuthenticationRouter {
  public constructor(private readonly _httpTools: HTTPTools) {}

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
      `http://localhost:${getConfig().port}/api/auth/local`,
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

  private _getAuth(
    req: Request,
  ): operations['getAuth']['responses']['200']['content']['application/json'] {
    if (req.nakar.possibleUser == null) {
      throw new Unauthorized();
    }
    return {
      username: req.nakar.possibleUser.username ?? '',
    };
  }
}
