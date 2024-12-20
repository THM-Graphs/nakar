import { ApiProperty } from '@nestjs/swagger';
import { GetDatabaseDefinitionDto } from './GetDatabaseDefinitionDto';
import { Type } from 'class-transformer';

export class GetDatabaseDefinitionsDto {
  @ApiProperty({ type: GetDatabaseDefinitionDto, isArray: true })
  @Type(() => GetDatabaseDefinitionDto)
  databaseDefinitions: Array<GetDatabaseDefinitionDto>;

  constructor(databaseDefinitions: Array<GetDatabaseDefinitionDto>) {
    this.databaseDefinitions = databaseDefinitions;
  }
}
