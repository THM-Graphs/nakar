import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { Database } from './database/entities/Database';
import { Scenario } from './database/entities/Scenario';

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

  const entityManager: EntityManager = app.get(EntityManager);
  await generateDemoConfigs(entityManager);

  await app.listen(process.env.SERVER_PORT ?? 3000);

  console.log('http://localhost:3000/api');
}
bootstrap().catch(console.error);

async function generateDemoConfigs(
  entityManager: EntityManager,
): Promise<void> {
  const databaseManager = entityManager.getRepository(Database);
  if (!(await databaseManager.exists({ where: { title: 'POSE Database' } }))) {
    const database: Database = new Database();
    database.title = 'POSE Database';
    database.host = 'localhost';
    database.port = 7687;
    database.username = 'neo4j';
    database.password = '12345678';
    await databaseManager.save(database);
  }

  const scenarioManager = entityManager.getRepository(Scenario);
  if (
    !(await scenarioManager.exists({ where: { title: 'Test Scenario 1' } }))
  ) {
    const scenario = new Scenario();
    scenario.title = 'Test Scenario 1';
    scenario.query = `MATCH (p:Person) WHERE p.name = "Philip" AND p.surname = "Scott" MATCH (p)-[r]->(neighbor) RETURN p, r, neighbor`;
    scenario.database = (await databaseManager.findOne({
      where: { title: 'POSE Database' },
    }))!;
    await scenarioManager.save(scenario);
  }
}
