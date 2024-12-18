import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { GraphDto } from '../model/GraphDto';
import { ScenarioDto } from './dto/ScenarioDto';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Scenario } from '../database/entities/Scenario';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('scenarios')
export class ScenariosController {
  constructor(
    private readonly neo4jService: Neo4jService,
    @InjectRepository(Scenario)
    private scenarioRepository: Repository<Scenario>,
  ) {}

  @Get('/')
  @ApiResponse({ type: ScenarioDto, isArray: true })
  async getAllScenarios(): Promise<ScenarioDto[]> {
    const scenarios = await this.scenarioRepository.find();
    return scenarios.map((s) => this.mapScenario(s));
  }

  @Get('/:slug')
  @ApiResponse({ type: ScenarioDto })
  async getScenario(@Param('slug') slug: string): Promise<ScenarioDto> {
    const result = this.scenarioRepository.
    if (result == null) {
      throw new NotFoundException();
    }
    return new ScenarioDto(slug, result.title);
  }

  @Get('/:slug/graph')
  @ApiResponse({ type: GraphDto })
  async getScenarioResult(@Param('slug') slug: string): Promise<GraphDto> {
    const scenario = this.scenarios.get(slug);
    if (scenario == null) {
      throw new NotFoundException();
    }
    const result = await scenario.process(this.neo4jService);
    return result;
  }

  private mapScenario(scenario: Scenario): ScenarioDto {
    const dto = new ScenarioDto(scenario.id, scenario.title);
    return dto;
  }
}
