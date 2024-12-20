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
import { RepositoryService } from '../repository/repository.service';
import { ApiResponse } from '@nestjs/swagger';
import { GetDatabaseDefinitionsDto } from './dto/GetDatabaseDefinitionsDto';
import { GetDatabaseDefinitionDto } from './dto/GetDatabaseDefinitionDto';
import { DatabaseDefinition } from '../repository/entities/DatabaseDefinition';
import { PutPostDatabaseDefinitionDto } from './dto/PutPostDatabaseDefinitionDto';

@Controller('database-definition')
export class DatabaseDefinitionController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Get('/')
  @ApiResponse({ type: GetDatabaseDefinitionsDto })
  async get(): Promise<GetDatabaseDefinitionsDto> {
    const object =
      await this.repositoryService.databaseDefinitionRepository.find();
    return new GetDatabaseDefinitionsDto(object.map((s) => this.mapToDto(s)));
  }

  @Post('/')
  @ApiResponse({ type: GetDatabaseDefinitionDto })
  async post(
    @Body() body: PutPostDatabaseDefinitionDto,
  ): Promise<GetDatabaseDefinitionDto> {
    const object = new DatabaseDefinition(
      body.title,
      body.host,
      body.port,
      body.username,
      body.password,
    );

    await this.repositoryService.databaseDefinitionRepository.save(object);
    return this.mapToDto(object);
  }

  @Get('/:id')
  @ApiResponse({ type: GetDatabaseDefinitionDto })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetDatabaseDefinitionDto> {
    const object =
      await this.repositoryService.databaseDefinitionRepository.findOneBy({
        id: id,
      });
    if (object == null) {
      throw new NotFoundException();
    }
    return this.mapToDto(object);
  }

  @Put('/:id')
  @ApiResponse({ type: GetDatabaseDefinitionDto })
  async put(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PutPostDatabaseDefinitionDto,
  ): Promise<GetDatabaseDefinitionDto> {
    const object =
      await this.repositoryService.databaseDefinitionRepository.findOneBy({
        id: id,
      });
    if (object == null) {
      throw new NotFoundException('Object not found.');
    }
    object.title = body.title;
    object.host = body.host;
    object.port = body.port;
    object.username = body.username;
    object.password = body.password;
    await this.repositoryService.databaseDefinitionRepository.save(object);
    return this.mapToDto(object);
  }

  @Delete('/:id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    if (
      !(await this.repositoryService.databaseDefinitionRepository.existsBy({
        id: id,
      }))
    ) {
      throw new NotFoundException();
    }
    await this.repositoryService.databaseDefinitionRepository.delete({
      id: id,
    });
  }

  private mapToDto(object: DatabaseDefinition): GetDatabaseDefinitionDto {
    return new GetDatabaseDefinitionDto(
      object.id,
      object.title,
      object.host,
      object.port,
      object.username,
    );
  }
}
