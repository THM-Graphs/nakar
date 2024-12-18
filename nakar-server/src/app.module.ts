import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j/neo4j.service';
import { ScenariosController } from './scenarios/scenarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Database } from './database/entities/Database';
import { Scenario } from './database/entities/Scenario';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Database, Scenario],
      synchronize: true,
    }),
  ],
  controllers: [ScenariosController],
  providers: [Neo4jService, DatabaseService],
})
export class AppModule {}
