import { INestApplication, ValidationPipe } from '@nestjs/common';
import { RepositoryService } from './repository/repository.service';
import { DatabaseDefinition } from './repository/entities/DatabaseDefinition';
import { Scenario } from './repository/entities/Scenario';

export function configureApp(app: INestApplication) {
  app.enableCors();
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

export async function generateDemoData(app: INestApplication) {
  const d1 = await app
    .get(RepositoryService)
    .databaseDefinitionRepository.save(
      new DatabaseDefinition('POSE', 'localhost', 7548, 'neo4j', '12345678'),
    );
  const d2 = await app
    .get(RepositoryService)
    .databaseDefinitionRepository.save(
      new DatabaseDefinition(
        'WikiData',
        'localhost',
        7548,
        'uiawg32iuqa',
        'seihu23ise',
      ),
    );
  const d3 = await app
    .get(RepositoryService)
    .databaseDefinitionRepository.save(
      new DatabaseDefinition('Briefe', 'localhost', 7486, 'neo4j', 'neo4j'),
    );

  for (let i = 0; i < 65; i += 1) {
    await app
      .get(RepositoryService)
      .scenarioRepository.save(new Scenario('Major Crimes', 'MATCH XYZ', d1));
    await app
      .get(RepositoryService)
      .scenarioRepository.save(new Scenario('Crime Families', 'MATCH XYZ', d1));
    await app
      .get(RepositoryService)
      .scenarioRepository.save(new Scenario('Common Crimes', 'MATCH XYZ', d1));

    await app
      .get(RepositoryService)
      .scenarioRepository.save(new Scenario('Dynasties', 'MATCH XYZ', d2));
    await app
      .get(RepositoryService)
      .scenarioRepository.save(new Scenario('Pen-Pals', 'MATCH XYZ', d3));
    await app
      .get(RepositoryService)
      .scenarioRepository.save(
        new Scenario('Most referred to people', 'MATCH XYZ', d3),
      );
  }
}
