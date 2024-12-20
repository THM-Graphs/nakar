import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Environment } from './environment/Environment';
import { configureApp, generateDemoData } from './bootstrap';

async function bootstrap() {
  Logger.debug(Environment);
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('NAKAR Server')
    .setDescription(
      'This server translates various graph databases and scenarios into a simple graph-structure to be consumed by nakar clients.',
    )
    .setVersion('1.0')
    .addServer(
      'http://localhost:3000',
      'The default testing server for local development.',
    )
    .build();
  SwaggerModule.setup(
    'api',
    app,
    () => SwaggerModule.createDocument(app, config),
    {
      jsonDocumentUrl: 'api/json',
      yamlDocumentUrl: 'api/yaml',
    },
  );

  if (Environment.DATABASE_DATABASE == ':memory:') {
    Logger.warn('Will create demo data because in-memory database is used');
    await generateDemoData(app);
  }

  await app.listen(Environment.SERVER_PORT, Environment.SERVER_HOSTNAME);

  Logger.verbose(
    `http://${Environment.SERVER_HOSTNAME}:${Environment.SERVER_PORT}/api`,
  );
}
bootstrap().catch(Logger.error);
