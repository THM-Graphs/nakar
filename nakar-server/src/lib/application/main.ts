import type { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';
import { getConfig } from '../config/getConfig';
import type { SanitizedConfig } from '../config/SanitizedConfig';
import { ValidationPipe } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';
import { RouteLogger } from '../http/interceptors/RouteLogger';
import { ActionWsdto } from '../socketIO/dto/ActionWsdto';
import { validationPipelineOptions } from './validationPipelineOptions';
import { EventWsdto } from '../socketIO/dto/EventWsdto';
import { AuthWsdto } from '../socketIO/dto/AuthWsdto';
import { MonitoringService } from '../monitoring/MonitoringService';

let nestApp: NestExpressApplication | null = null;

export async function bootstrapNest(): Promise<NestExpressApplication> {
  const config: SanitizedConfig = getConfig();
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
    });
  nestApp = app;

  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new RouteLogger());
  app.useGlobalPipes(new ValidationPipe(validationPipelineOptions));
  app.use(cors({ origin: config.allowedOrigins }));

  SwaggerModule.setup(
    '/api/docs',
    app,
    (): OpenAPIObject =>
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('NAKAR')
          .setVersion('1.0.0')
          .addBearerAuth({ type: 'apiKey' })
          .build(),
        { extraModels: [ActionWsdto, EventWsdto, AuthWsdto] },
      ),
    { raw: ['yaml'], explorer: true, yamlDocumentUrl: '/api.yaml' },
  );

  await app.listen(config.port + 1, config.host);

  strapi.log.http(`${await app.getUrl()}/api/docs`);

  const monitoringService: MonitoringService = app.get(MonitoringService);
  monitoringService.pushEvent({
    type: 'application_did_start',
    userInfo: null,
    objectInfo: null,
    metaData: null,
  });

  return app;
}

export async function destroyNest(): Promise<void> {
  const monitoringService: MonitoringService | null =
    nestApp?.get(MonitoringService) ?? null;
  monitoringService?.pushEvent({
    type: 'application_will_shutdown',
    userInfo: null,
    objectInfo: null,
    metaData: null,
  });
  await nestApp?.close();
}
