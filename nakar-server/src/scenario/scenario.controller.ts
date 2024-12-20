import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { GetScenarioDto } from './dto/GetScenarioDto';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Scenario } from '../repository/entities/Scenario';
import { RepositoryService } from '../repository/repository.service';
import { GetScenariosDto } from './dto/GetScenariosDto';
import { PutPostScenarioDto } from './dto/PutPostScenarioDto';

@Controller('scenario')
export class ScenarioController {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly repositoryService: RepositoryService,
  ) {}

  @Get('/')
  @ApiResponse({ type: GetScenariosDto })
  async get(): Promise<GetScenariosDto> {
    const object = await this.repositoryService.scenarioRepository.find();
    return new GetScenariosDto(object.map((s) => this.mapToDto(s)));
  }

  @Post('/')
  @ApiResponse({ type: GetScenarioDto })
  async post(@Body() body: PutPostScenarioDto): Promise<GetScenarioDto> {
    const databaseDefinition =
      await this.repositoryService.databaseDefinitionRepository.findOneBy({
        id: body.databaseDefinitionId,
      });
    if (databaseDefinition == null) {
      throw new NotFoundException('Database definition not found.');
    }
    const object = new Scenario(body.title, body.query, databaseDefinition);

    await this.repositoryService.scenarioRepository.save(object);
    return this.mapToDto(object);
  }

  @Get('/:id')
  @ApiResponse({ type: GetScenarioDto })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetScenarioDto> {
    const object = await this.repositoryService.scenarioRepository.findOneBy({
      id: id,
    });
    if (object == null) {
      throw new NotFoundException();
    }
    return this.mapToDto(object);
  }

  @Put('/:id')
  @ApiResponse({ type: GetScenarioDto })
  async put(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PutPostScenarioDto,
  ): Promise<GetScenarioDto> {
    const object = await this.repositoryService.scenarioRepository.findOneBy({
      id: id,
    });
    if (object == null) {
      throw new NotFoundException('Object not found.');
    }
    const databaseDefinition =
      await this.repositoryService.databaseDefinitionRepository.findOneBy({
        id: body.databaseDefinitionId,
      });
    if (databaseDefinition == null) {
      throw new NotFoundException('Database definition not found.');
    }
    object.title = body.title;
    object.query = body.query;
    object.databaseDefinition = databaseDefinition;
    await this.repositoryService.scenarioRepository.save(object);
    return this.mapToDto(object);
  }

  @Delete('/:id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    if (
      !(await this.repositoryService.scenarioRepository.existsBy({ id: id }))
    ) {
      throw new NotFoundException();
    }
    await this.repositoryService.scenarioRepository.delete({ id: id });
  }

  private mapToDto(object: Scenario): GetScenarioDto {
    return new GetScenarioDto(
      object.id,
      object.title,
      object.query,
      object.databaseDefinition.id,
      object.createDate,
      object.updateDate,
      object.version,
    );
  }
}
