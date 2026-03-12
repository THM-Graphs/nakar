import { ApiProperty } from '@nestjs/swagger';
import { UserPreviewDto } from './UserPreviewDto';
import { ScenarioArgumentDto } from '../../http/routes/canvas-action/dto/ScenarioArgumentDto';
import { ScenarioParameterDto } from './ScenarioParameterDto';

export class LiveCanvasMetaDataDto {
  @ApiProperty({ type: String, nullable: true })
  public scenarioId: string | null;

  @ApiProperty({ type: ScenarioParameterDto, isArray: true })
  public parameters: ScenarioParameterDto[];

  @ApiProperty({ type: ScenarioArgumentDto, isArray: true })
  public arguments: ScenarioArgumentDto[];

  @ApiProperty({ nullable: true, type: 'string' })
  public undoAction: string | null;

  @ApiProperty({ nullable: true, type: 'string' })
  public redoAction: string | null;

  @ApiProperty({ type: [UserPreviewDto] })
  public users: UserPreviewDto[];

  public constructor(data: {
    scenarioId: string | null;
    parameters: ScenarioParameterDto[];
    arguments: ScenarioArgumentDto[];
    undoAction: string | null;
    redoAction: string | null;
    users: UserPreviewDto[];
  }) {
    this.scenarioId = data.scenarioId;
    this.parameters = data.parameters;
    this.arguments = data.arguments;
    this.undoAction = data.undoAction;
    this.redoAction = data.redoAction;
    this.users = data.users;
  }
}
