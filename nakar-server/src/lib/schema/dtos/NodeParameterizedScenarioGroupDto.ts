import { ApiProperty } from '@nestjs/swagger';
import { NodeParameterizedScenarioDto } from './NodeParameterizedScenarioDto';

export class NodeParameterizedScenarioGroupDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ isArray: true, type: NodeParameterizedScenarioDto })
  public scenarios: NodeParameterizedScenarioDto[];

  public constructor(data: {
    id: string;
    scenarios: NodeParameterizedScenarioDto[];
  }) {
    this.id = data.id;
    this.scenarios = data.scenarios;
  }
}
