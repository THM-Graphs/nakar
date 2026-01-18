import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { GetUrlRequestQueryDto } from './dto/GetUrlRequestQueryDto';
import { GetUrlResponseBodyDto } from './dto/GetUrlResponseBodyDto';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { ApiResponse } from '@nestjs/swagger';
import { FindMany } from '@strapi/types/dist/modules/documents/params/document-engine';

@Controller('redirect')
export class RedirectController {
  private readonly _logger: Logger = createChildLogger(this);

  @Get('/url')
  @ApiResponse({ type: GetUrlResponseBodyDto })
  public async getUrl(
    @Query() query: GetUrlRequestQueryDto,
  ): Promise<GetUrlResponseBodyDto> {
    const foundRedirects: Result<'api::redirect.redirect'>[] = await strapi
      .documents('api::redirect.redirect')
      .findMany({
        status: 'published',
        filters: {
          sourceUrl: query.url,
        },
      } satisfies FindMany<'api::redirect.redirect'>);

    if (foundRedirects.length === 0) {
      throw new NotFoundException();
    }
    if (foundRedirects.length > 1) {
      this._logger.warn(`Multiple redirect urls found for ${query.url}`);
    }

    const redirect: Result<'api::redirect.redirect'> = foundRedirects[0];
    if (redirect.targetUrl == null) {
      throw new NotFoundException();
    }

    return new GetUrlResponseBodyDto({ url: redirect.targetUrl });
  }
}
