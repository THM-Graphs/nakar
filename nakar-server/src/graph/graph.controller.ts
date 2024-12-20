import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GraphDto } from './dto/GraphDto';
import { Neo4jService } from '../neo4j/neo4j.service';
import { RepositoryService } from '../repository/repository.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller('graph')
export class GraphController {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly repositoryService: RepositoryService,
  ) {}

  @Get('/:scenarioId/initial')
  @ApiResponse({ type: GraphDto })
  async getGraph(
    @Param('scenario-id', ParseIntPipe) scenarioId: number,
  ): Promise<GraphDto> {
    const scenario = await this.repositoryService.scenarioRepository.findOneBy({
      id: scenarioId,
    });
    if (scenario == null) {
      throw new NotFoundException();
    }
    return await this.neo4jService.executeQuery(
      scenario.databaseDefinition,
      scenario.query,
    );
  }
}
