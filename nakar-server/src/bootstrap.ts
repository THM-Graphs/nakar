import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configureApp(app: INestApplication) {
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
}
