import type { Response } from 'express';
import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { PostAuthRequestBodyDto } from './dto/PostAuthRequestBodyDto';
import { PostAuthResponseBodyDto } from './dto/PostAuthResponseBodyDto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import * as undici from 'undici';
import {
  BadGateway,
  BadRequest,
  Conflict,
  ServiceUnavailable,
  TooManyRequests,
  Unauthorized,
} from 'http-errors';
import z from 'zod';
import { GetAuthResponseBodyDto } from './dto/GetAuthResponseBodyDto';
import type { Modules } from '@strapi/types';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { StrapiService } from '../../../strapi/StrapiService';
import { PostRegisterRequestBodyDto } from './dto/PostRegisterRequestBodyDto';

@Controller('/auth')
export class AuthController {
  public constructor(
    private readonly _authService: AuthService,
    private readonly _strapiService: StrapiService,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiBody({ type: PostAuthRequestBodyDto })
  @ApiResponse({ type: PostAuthResponseBodyDto })
  public async postAuth(
    @Body() body: PostAuthRequestBodyDto,
  ): Promise<PostAuthResponseBodyDto> {
    const result: undici.Response = await undici.fetch(
      `${this._strapiService.strapiUrl}/api/auth/local`,
      {
        method: 'POST',
        body: JSON.stringify({
          identifier: body.username,
          password: body.password,
        }),
        headers: new undici.Headers([['Content-Type', 'application/json']]),
      },
    );
    if (result.status === 429) {
      await result.body?.cancel();
      throw new TooManyRequests();
    }
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

    return new PostAuthResponseBodyDto({
      username: response.user.username,
      jwt: response.jwt,
    });
  }

  @Post('/register')
  @ApiBody({ type: PostRegisterRequestBodyDto })
  @ApiResponse({ status: 201, type: PostAuthResponseBodyDto })
  public async postRegister(
    @Body() body: PostRegisterRequestBodyDto,
  ): Promise<PostAuthResponseBodyDto> {
    const result: undici.Response = await undici.fetch(
      `${this._strapiService.strapiUrl}/api/auth/local/register`,
      {
        method: 'POST',
        headers: new undici.Headers([['Content-Type', 'application/json']]),
        body: JSON.stringify({
          username: body.username,
          email: body.email,
          password: body.password,
        }),
      },
    );
    if (result.status === 400) {
      const error: { error: { message: string } } | undefined = z
        .object({ error: z.object({ message: z.string() }) })
        .safeParse(await result.json()).data;
      if (error?.error.message === 'Email or Username are already taken') {
        throw new Conflict('Username or email address is already in use.');
      }
      if (error?.error.message === 'Register action is currently disabled') {
        throw new ServiceUnavailable('Registration is unavailable.');
      }
      throw new BadRequest('Registration details are invalid.');
    }
    if (!result.ok) {
      await result.body?.cancel();
      if (result.status === 429) {
        throw new TooManyRequests();
      }
      if (result.status === 403) {
        throw new ServiceUnavailable('Registration is unavailable.');
      }
      throw new BadGateway('Strapi could not create the account.');
    }
    const session: { jwt: string; user: { username: string } } | undefined = z
      .object({
        jwt: z.string().min(1),
        user: z.object({ username: z.string() }),
      })
      .safeParse(await result.json()).data;
    if (session == null) {
      throw new BadGateway('Strapi did not return a login token.');
    }
    return new PostAuthResponseBodyDto({
      username: session.user.username,
      jwt: session.jwt,
    });
  }

  @Get()
  @ApiResponse({ type: GetAuthResponseBodyDto })
  public async getAuth(
    @JWT() jwt: string | null,
    @Res({ passthrough: true }) response: Response,
  ): Promise<GetAuthResponseBodyDto> {
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    if (user == null) {
      response.setHeader('WWW-Authenticate', 'Bearer');
      throw new Unauthorized();
    }
    return {
      username: user.username ?? '',
    };
  }
}
