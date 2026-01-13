import { ScenarioDto } from './ScenarioDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioGroupDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ isArray: true, type: ScenarioDto })
  public scenarios: ScenarioDto[];

  public constructor(data: {
    id: string;
    title: string;
    scenarios: ScenarioDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.scenarios = data.scenarios;
  }
}
