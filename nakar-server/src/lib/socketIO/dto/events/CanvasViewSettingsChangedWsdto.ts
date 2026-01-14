import { LiveCanvasViewSettingsDto } from '../../../schema/dtos/LiveCanvasViewSettingsDto';
import { ApiProperty } from '@nestjs/swagger';

export class CanvasViewSettingsChangedWsdto {
  @ApiProperty({ enum: ['CanvasViewSettingsChangedWsdto'] })
  public type: 'CanvasViewSettingsChangedWsdto';

  @ApiProperty({ type: LiveCanvasViewSettingsDto })
  public viewSettings: LiveCanvasViewSettingsDto;

  public constructor(data: {
    type: 'CanvasViewSettingsChangedWsdto';
    viewSettings: LiveCanvasViewSettingsDto;
  }) {
    this.type = data.type;
    this.viewSettings = data.viewSettings;
  }
}
