import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';
import { getConfig } from '../config/getConfig';
import { SanitizedConfig } from '../config/SanitizedConfig';

let nestApp: NestExpressApplication | null = null;

export async function bootstrapNest(): Promise<void> {
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule);
  nestApp = app;

  const config: SanitizedConfig = getConfig();
  await app.listen(config.port + 2, config.host);
}

export async function destroyNest(): Promise<void> {
  await nestApp?.close();
}
