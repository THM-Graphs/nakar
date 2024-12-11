import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
      transformOptions: {
        excludeExtraneousValues: true,
        enableImplicitConversion: false,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NAKAR Server')
    .setDescription(
      'This server translates various graph databases and scenarios into a simple graph-structure to be consumed by nakar clients.',
    )
    .setVersion('1.0')
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

  await app.listen(process.env.SERVER_PORT ?? 3000);

  console.log('http://localhost:3000/api');
}
bootstrap().catch(console.error);
