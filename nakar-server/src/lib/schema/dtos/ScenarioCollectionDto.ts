import { ScenarioGroupDto } from './ScenarioGroupDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioCollectionDto {
  @ApiProperty({ isArray: true, type: ScenarioGroupDto })
  public scenarioGroups: ScenarioGroupDto[];

  public constructor(data: { scenarioGroups: ScenarioGroupDto[] }) {
    this.scenarioGroups = data.scenarioGroups;
  }
}
