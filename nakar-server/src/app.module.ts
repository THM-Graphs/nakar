import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j/neo4j.service';
import { ScenarioController } from './scenario/scenario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseDefinition } from './repository/entities/DatabaseDefinition';
import { Scenario } from './repository/entities/Scenario';
import { RepositoryService } from './repository/repository.service';
import { Environment } from './environment/Environment';
import { DatabaseDefinitionController } from './database-definition/database-definition.controller';
import { GraphController } from './graph/graph.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: Environment.DATABASE_TYPE as any,
      database: Environment.DATABASE_DATABASE,
      host: Environment.DATABASE_HOST,
      port: Environment.DATABASE_PORT,
      username: Environment.DATABASE_USERNAME,
      password: Environment.DATABASE_PASSWORD,
      entities: [DatabaseDefinition, Scenario],
      synchronize: true,
    }),
  ],
  controllers: [
    ScenarioController,
    DatabaseDefinitionController,
    GraphController,
  ],
  providers: [Neo4jService, RepositoryService],
})
export class AppModule {}
