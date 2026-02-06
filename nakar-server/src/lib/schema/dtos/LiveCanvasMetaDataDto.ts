import { ScenarioDto } from './ScenarioDto';
import { ApiProperty } from '@nestjs/swagger';
import { UserPreviewDto } from './UserPreviewDto';
import { ScenarioArgumentDto } from '../../http/routes/canvas-action/dto/ScenarioArgumentDto';

export class LiveCanvasMetaDataDto {
  @ApiProperty({ type: ScenarioDto, nullable: true })
  public scenario: ScenarioDto | null;

  @ApiProperty({ type: ScenarioArgumentDto, isArray: true })
  public arguments: ScenarioArgumentDto[];

  @ApiProperty({ nullable: true, type: 'string' })
  public undoAction: string | null;

  @ApiProperty({ nullable: true, type: 'string' })
  public redoAction: string | null;

  @ApiProperty({ type: [UserPreviewDto] })
  public users: UserPreviewDto[];

  public constructor(data: {
    scenario: ScenarioDto | null;
    arguments: ScenarioArgumentDto[];
    undoAction: string | null;
    redoAction: string | null;
    users: UserPreviewDto[];
  }) {
    this.scenario = data.scenario;
    this.arguments = data.arguments;
    this.undoAction = data.undoAction;
    this.redoAction = data.redoAction;
    this.users = data.users;
  }
}
