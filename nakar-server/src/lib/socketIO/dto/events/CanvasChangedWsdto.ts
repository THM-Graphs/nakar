import { ApiProperty } from '@nestjs/swagger';

export class CanvasChangedWsdto {
  @ApiProperty({ enum: ['CanvasChangedWsdto'] })
  public type: 'CanvasChangedWsdto';

  @ApiProperty({ type: 'string', isArray: true })
  public canvasId: string | null;

  public constructor(data: {
    type: 'CanvasChangedWsdto';
    canvasId: string | null;
  }) {
    this.type = data.type;
    this.canvasId = data.canvasId;
  }
}
