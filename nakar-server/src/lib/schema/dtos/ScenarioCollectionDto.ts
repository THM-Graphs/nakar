import { ScenarioGroupDto } from './ScenarioGroupDto';
import { DatabaseConnectionDto } from './DatabaseConnectionDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioCollectionDto {
  @ApiProperty({ isArray: true, type: ScenarioGroupDto })
  public scenarioGroups: ScenarioGroupDto[];

  @ApiProperty({ isArray: true, type: DatabaseConnectionDto })
  public referencedDatabases: DatabaseConnectionDto[];

  public constructor(data: {
    scenarioGroups: ScenarioGroupDto[];
    referencedDatabases: DatabaseConnectionDto[];
  }) {
    this.scenarioGroups = data.scenarioGroups;
    this.referencedDatabases = data.referencedDatabases;
  }
}
