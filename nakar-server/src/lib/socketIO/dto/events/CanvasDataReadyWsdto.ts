import { ApiProperty } from '@nestjs/swagger';
import { CanvasDataDto } from '../types/CanvasDataDto';

export class CanvasDataReadyWsdto {
  @ApiProperty({ enum: ['CanvasDataReadyWsdto'] })
  public type: 'CanvasDataReadyWsdto';

  @ApiProperty({ type: CanvasDataDto })
  public data: CanvasDataDto;

  public constructor(data: {
    type: 'CanvasDataReadyWsdto';
    data: CanvasDataDto;
  }) {
    this.type = data.type;
    this.data = data.data;
  }
}
