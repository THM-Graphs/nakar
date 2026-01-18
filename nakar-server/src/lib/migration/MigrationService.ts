import { UID } from '@strapi/types';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents';
import { SMap } from '../map/Map';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly _logger: Logger = createChildLogger(this);

  public async onModuleInit(): Promise<void> {}
}
