import { ApiProperty } from '@nestjs/swagger';
import { LiveCanvasDataDto } from '../../../schema/dtos/LiveCanvasDataDto';

export class CanvasDataReadyWsdto {
  @ApiProperty({ enum: ['CanvasDataReadyWsdto'] })
  public type: 'CanvasDataReadyWsdto';

  @ApiProperty({ type: LiveCanvasDataDto })
  public data: LiveCanvasDataDto;

  public constructor(data: {
    type: 'CanvasDataReadyWsdto';
    data: LiveCanvasDataDto;
  }) {
    this.type = data.type;
    this.data = data.data;
  }
}
