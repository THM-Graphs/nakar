import { Controller, Get, Query } from '@nestjs/common';
import { GetUrlRequestQueryDto } from './dto/GetUrlRequestQueryDto';
import { GetUrlResponseBodyDto } from './dto/GetUrlResponseBodyDto';
import type { Modules } from '@strapi/types';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { ApiResponse } from '@nestjs/swagger';

@Controller('redirect')
export class RedirectController {
  private readonly _logger: Logger = createChildLogger(this);

  @Get('/url')
  @ApiResponse({ type: GetUrlResponseBodyDto })
  public async getUrl(
    @Query() query: GetUrlRequestQueryDto,
  ): Promise<GetUrlResponseBodyDto> {
    const foundRedirects: Modules.Documents.Result<'api::redirect.redirect'>[] =
      await strapi.documents('api::redirect.redirect').findMany({
        status: 'published',
        filters: {
          sourceUrl: query.url,
        },
      });

    if (foundRedirects.length === 0) {
      return new GetUrlResponseBodyDto({ url: null });
    }
    if (foundRedirects.length > 1) {
      this._logger.warn(`Multiple redirect urls found for ${query.url}`);
    }

    const redirect: Modules.Documents.Result<'api::redirect.redirect'> =
      foundRedirects[0];
    if (redirect.targetUrl == null) {
      return new GetUrlResponseBodyDto({ url: null });
    }

    return new GetUrlResponseBodyDto({ url: redirect.targetUrl });
  }
}
