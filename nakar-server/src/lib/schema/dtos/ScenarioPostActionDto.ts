import { ScenarioPostActionTypeDto } from './ScenarioPostActionTypeDto';
import { ScenarioPostActionLayoutAlgorithmDto } from './ScenarioPostActionLayoutAlgorithmDto';
import { ApiProperty } from '@nestjs/swagger';
import { ColorPresetDto } from './ColorPresetDto';

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

  @ApiProperty({ type: String })
  public relationshipType: string;

  @ApiProperty({ type: Number })
  public factor: number;

  @ApiProperty({ type: Number })
  public width: number;

  @ApiProperty({
    type: ColorPresetDto,
  })
  public color: ColorPresetDto;

  @ApiProperty({ type: Number })
  public radius: number;

  @ApiProperty({ type: String })
  public property: string;

  public constructor(data: {
    id: string;
    type: ScenarioPostActionTypeDto;
    label: string;
    circleRadius: number;
    layoutAlgorithm: ScenarioPostActionLayoutAlgorithmDto;
    relationshipType: string;
    factor: number;
    width: number;
    color: ColorPresetDto;
    radius: number;
    property: string;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.label = data.label;
    this.circleRadius = data.circleRadius;
    this.layoutAlgorithm = data.layoutAlgorithm;
    this.relationshipType = data.relationshipType;
    this.factor = data.factor;
    this.width = data.width;
    this.color = data.color;
    this.radius = data.radius;
    this.property = data.property;
  }
}
