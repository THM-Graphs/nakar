import { ApiProperty } from '@nestjs/swagger';

export class CanvasReadyWsdto {
  @ApiProperty({ enum: ['CanvasReadyWsdto'] })
  public type: 'CanvasReadyWsdto';

  public constructor(data: { type: 'CanvasReadyWsdto' }) {
    this.type = data.type;
  }
}
