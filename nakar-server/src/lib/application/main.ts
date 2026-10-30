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
import { mkdir, writeFile } from 'node:fs/promises';
import { dump } from 'js-yaml';
import { dirname, resolve } from 'node:path';
import { StrapiService } from '../strapi/StrapiService';
import type { AddressInfo } from 'node:net';

let nestApp: NestExpressApplication | null = null;

function emitAppStarted(app: NestExpressApplication): void {
  const monitoringService: MonitoringService = app.get(MonitoringService);
  const strapiService: StrapiService = app.get(StrapiService);
  const apiAddress: string | AddressInfo | null = app.getHttpServer().address();

  if (apiAddress == null || typeof apiAddress === 'string') {
    throw new Error('Unable to get address of api server.');
  }

  monitoringService.pushEvent({
    type: 'application_did_start',
    userInfo: null,
    objectInfo: null,
    metaData: {
      strapiPort: strapiService.getStrapiPort().toString(),
      apiPort: apiAddress.port.toString(),
    },
  });
}

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

  const openApiObject: OpenAPIObject = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('NAKAR')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'apiKey' })
      .build(),
    { extraModels: [ActionWsdto, EventWsdto, AuthWsdto] },
  );
  SwaggerModule.setup('/api/docs', app, openApiObject, {
    raw: ['yaml'],
    explorer: true,
    yamlDocumentUrl: '/api.yaml',
  });

  await app.listen(config.apiPort, config.host);

  strapi.log.http(`${await app.getUrl()}/api/docs`);

  if (strapi.config.get('environment') === 'development') {
    const path: string = resolve('./.tmp/apidoc.yml');
    await mkdir(dirname(path), { recursive: true });
    await writeFile(
      path,
      dump(openApiObject, { skipInvalid: true, noRefs: true }),
      'utf-8',
    );
    strapi.log.info(
      `Did write api doc to ${path}, because environment is ${strapi.config.get<string>('environment')}.`,
    );
  }

  if (strapi.server.httpServer.listening) {
    emitAppStarted(app);
  } else {
    strapi.server.httpServer.once('listening', (): void => {
      emitAppStarted(app);
    });
  }

  return app;
}

export async function destroyNest(): Promise<void> {
  await nestApp?.close();
}
