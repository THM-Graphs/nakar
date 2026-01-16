import { Body, Controller, Get, Post } from '@nestjs/common';
import { PostAuthRequestBodyDto } from './dto/PostAuthRequestBodyDto';
import { PostAuthResponseBodyDto } from './dto/PostAuthResponseBodyDto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import * as undici from 'undici';
import { getConfig } from '../../../config/getConfig';
import { Unauthorized } from 'http-errors';
import z from 'zod';
import { GetAuthResponseBodyDto } from './dto/GetAuthResponseBodyDto';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';

@Controller('/auth')
export class AuthController {
  public constructor(private readonly _authService: AuthService) {}

  @Post()
  @ApiBody({ type: PostAuthRequestBodyDto })
  @ApiResponse({ type: PostAuthResponseBodyDto })
  public async postAuth(
    @Body() body: PostAuthRequestBodyDto,
  ): Promise<PostAuthResponseBodyDto> {
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

    return new PostAuthResponseBodyDto({
      username: response.user.username,
      jwt: response.jwt,
    });
  }

  @Get()
  @ApiResponse({ type: GetAuthResponseBodyDto })
  public async getAuth(
    @JWT() jwt: string | null,
  ): Promise<GetAuthResponseBodyDto> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    if (user == null) {
      throw new Unauthorized();
    }
    return {
      username: user.username ?? '',
    };
  }
}
