import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';
import { getConfig } from '../config/getConfig';
import { SanitizedConfig } from '../config/SanitizedConfig';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';
import { RouteLogger } from '../http/interceptors/RouteLogger';

let nestApp: NestExpressApplication | null = null;

export async function bootstrapNest(): Promise<void> {
  const config: SanitizedConfig = getConfig();
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
    });
  nestApp = app;

  app.useGlobalInterceptors(new RouteLogger());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: false,
    }),
  );
  app.use(cors());

  SwaggerModule.setup(
    '/',
    app,
    (): OpenAPIObject =>
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('NAKAR').setVersion('1.0.0').build(),
      ),
    { raw: ['yaml'], explorer: true, yamlDocumentUrl: '/api.yaml' },
  );

  await app.listen(config.port + 1, config.host);
  strapi.log.http(await app.getUrl());
}

export async function destroyNest(): Promise<void> {
  await nestApp?.close();
}
