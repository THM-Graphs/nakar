import { ScenarioPostActionTypeDto } from './ScenarioPostActionTypeDto';
import { ScenarioPostActionLayoutAlgorithmDto } from './ScenarioPostActionLayoutAlgorithmDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioPostActionDto {
  @ApiProperty({ type: String })
  public id: string;

  @ApiProperty({ enum: ScenarioPostActionTypeDto })
  public type: ScenarioPostActionTypeDto;

  @ApiProperty({ type: String })
  public label: string;

  @ApiProperty({ type: Number })
  public circleRadius: number;

  @ApiProperty({ enum: ScenarioPostActionLayoutAlgorithmDto })
  public layoutAlgorithm: ScenarioPostActionLayoutAlgorithmDto;

  public constructor(data: {
    id: string;
    type: ScenarioPostActionTypeDto;
    label: string;
    circleRadius: number;
    layoutAlgorithm: ScenarioPostActionLayoutAlgorithmDto;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.label = data.label;
    this.circleRadius = data.circleRadius;
    this.layoutAlgorithm = data.layoutAlgorithm;
  }
}
