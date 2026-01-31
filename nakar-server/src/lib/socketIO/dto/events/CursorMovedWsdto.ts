import { ApiProperty } from '@nestjs/swagger';
import { PositionDto } from '../../../schema/dtos/PositionDto';

export class CursorMovedWsdto {
  @ApiProperty({ enum: ['CursorMovedWsdto'] })
  public type: 'CursorMovedWsdto';

  @ApiProperty({ type: PositionDto })
  public position: PositionDto;

  @ApiProperty()
  public socketId: string;

  public constructor(data: { position: PositionDto; socketId: string }) {
    this.type = 'CursorMovedWsdto';
    this.position = data.position;
    this.socketId = data.socketId;
  }
}
