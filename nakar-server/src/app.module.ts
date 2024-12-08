import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j/neo4j.service';
import { ScenariosController } from './scenarios/scenarios.controller';

@Module({
  imports: [],
  controllers: [ScenariosController],
  providers: [Neo4jService],
})
export class AppModule {}
