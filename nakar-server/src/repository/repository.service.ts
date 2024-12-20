import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Scenario } from './entities/Scenario';
import { DatabaseDefinition } from './entities/DatabaseDefinition';

@Injectable()
export class RepositoryService {
  readonly scenarioRepository: Repository<Scenario>;
  readonly databaseDefinitionRepository: Repository<DatabaseDefinition>;

  constructor(entityManager: EntityManager) {
    this.scenarioRepository = entityManager.getRepository(Scenario);
    this.databaseDefinitionRepository =
      entityManager.getRepository(DatabaseDefinition);
  }
}
