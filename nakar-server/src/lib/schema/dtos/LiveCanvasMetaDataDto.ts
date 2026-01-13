import { ScenarioDto } from './ScenarioDto';
import { ScenarioArgumentDto } from '../../http/routes/action/dto/ScenarioArgumentDto';
import { ApiProperty } from '@nestjs/swagger';

export class LiveCanvasMetaDataDto {
  @ApiProperty({ type: ScenarioDto, nullable: true })
  public scenario: ScenarioDto | null;

  @ApiProperty({ type: ScenarioArgumentDto, isArray: true })
  public arguments: ScenarioArgumentDto[];

  @ApiProperty({ nullable: true, type: 'string' })
  public undoAction: string | null;

  @ApiProperty({ nullable: true, type: 'string' })
  public redoAction: string | null;

  public constructor(data: {
    scenario: ScenarioDto | null;
    arguments: ScenarioArgumentDto[];
    undoAction: string | null;
    redoAction: string | null;
  }) {
    this.scenario = data.scenario;
    this.arguments = data.arguments;
    this.undoAction = data.undoAction;
    this.redoAction = data.redoAction;
  }
}
