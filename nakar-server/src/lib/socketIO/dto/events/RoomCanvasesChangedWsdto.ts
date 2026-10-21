import { ApiProperty } from '@nestjs/swagger';
import { CanvasDto } from '../../../schema/dtos/CanvasDto';

export class RoomCanvasesChangedWsdto {
  @ApiProperty({ enum: ['RoomCanvasesChangedWsdto'] })
  public type: 'RoomCanvasesChangedWsdto';

  @ApiProperty()
  public roomId: string;

  @ApiProperty({ type: CanvasDto, isArray: true })
  public canvases: CanvasDto[];

  public constructor(roomId: string, canvases: CanvasDto[]) {
    this.type = 'RoomCanvasesChangedWsdto';
    this.roomId = roomId;
    this.canvases = canvases;
  }
}
