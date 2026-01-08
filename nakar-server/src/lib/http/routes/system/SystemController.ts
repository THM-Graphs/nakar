import { Controller, Get } from '@nestjs/common';
import { GetVersionResponseBodyDto } from './dto/GetVersionResponseBodyDto';
import { ApiResponse } from '@nestjs/swagger';
import { getConfig } from '../../../config/getConfig';

@Controller('system')
export class SystemController {
  @Get('version')
  @ApiResponse({ type: GetVersionResponseBodyDto })
  public getVersion(): GetVersionResponseBodyDto {
    return new GetVersionResponseBodyDto({
      version: getConfig().version,
    });
  }
}
