import { LiveCanvasViewSettingsDto } from '../../../http/dto/LiveCanvasViewSettingsDto';
import { ApiProperty } from '@nestjs/swagger';

export class ViewSettingsChangedWsdto {
  @ApiProperty({ enum: ['ViewSettingsChangedWsdto'] })
  public type: 'ViewSettingsChangedWsdto';

  @ApiProperty({ type: LiveCanvasViewSettingsDto })
  public viewSettings: LiveCanvasViewSettingsDto;

  public constructor(data: {
    type: 'ViewSettingsChangedWsdto';
    viewSettings: LiveCanvasViewSettingsDto;
  }) {
    this.type = data.type;
    this.viewSettings = data.viewSettings;
  }
}
