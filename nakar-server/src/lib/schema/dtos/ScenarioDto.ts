import { ScenarioQueryDto } from './ScenarioQueryDto';
import { ScenarioParameterDto } from './ScenarioParameterDto';
import { ApiProperty } from '@nestjs/swagger';
import { ScenarioPostActionDto } from './ScenarioPostActionDto';

export class ScenarioDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ nullable: true, type: 'string' })
  public title: string | null;

  @ApiProperty({ isArray: true, type: ScenarioQueryDto })
  public queries: ScenarioQueryDto[];

  @ApiProperty({ nullable: true, type: 'string' })
  public description: string | null;

  @ApiProperty({ isArray: true, type: ScenarioParameterDto })
  public parameters: ScenarioParameterDto[];

  @ApiProperty({ isArray: true, type: ScenarioPostActionDto })
  public postScenarioActions: ScenarioPostActionDto[];

  @ApiProperty({ isArray: true, type: 'string' })
  public postActionsDescription: string[];

  public constructor(data: {
    id: string;
    title: string | null;
    queries: ScenarioQueryDto[];
    description: string | null;
    parameters: ScenarioParameterDto[];
    postScenarioActions: ScenarioPostActionDto[];
    postActionsDescription: string[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.queries = data.queries;
    this.description = data.description;
    this.parameters = data.parameters;
    this.postScenarioActions = data.postScenarioActions;
    this.postActionsDescription = data.postActionsDescription;
  }
}
