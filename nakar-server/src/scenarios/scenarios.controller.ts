import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { GraphDto } from '../model/GraphDto';
import { Scenario } from './Scenario';
import { TestScenario1 } from './TestScenario1';
import { ScenarioDto } from './dto/ScenarioDto';
import { Neo4jService } from '../neo4j/neo4j.service';

@Controller('scenarios')
export class ScenariosController {
  scenarios: Map<string, Scenario>;

  constructor(private readonly neo4jService: Neo4jService) {
    this.scenarios = new Map();
    this.scenarios.set('test_scenario_1', new TestScenario1());
  }

  @Get('/')
  @ApiResponse({ type: ScenarioDto, isArray: true })
  async getAllScenarios(): Promise<ScenarioDto[]> {
    const result: ScenarioDto[] = [];

    for (const [key, scenario] of this.scenarios.entries()) {
      result.push(new ScenarioDto(key, scenario.title));
    }

    return result;
  }

  @Get('/:slug')
  @ApiResponse({ type: ScenarioDto })
  async getScenario(@Param('slug') slug: string): Promise<ScenarioDto> {
    const result = this.scenarios.get(slug);
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
}
