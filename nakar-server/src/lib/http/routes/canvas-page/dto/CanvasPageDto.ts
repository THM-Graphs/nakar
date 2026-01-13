import { CanvasDto } from '../../../../schema/dtos/CanvasDto';
import { RoomDto } from '../../../../schema/dtos/RoomDto';
import { ScenarioCollectionDto } from '../../../../schema/dtos/ScenarioCollectionDto';
import { ApiProperty } from '@nestjs/swagger';

export class CanvasPageDto {
  @ApiProperty({ type: CanvasDto })
  public canvas: CanvasDto;

  @ApiProperty({ type: ScenarioCollectionDto })
  public scenarios: ScenarioCollectionDto;

  @ApiProperty({ type: RoomDto })
  public room: RoomDto;

  public constructor(data: {
    canvas: CanvasDto;
    scenarios: ScenarioCollectionDto;
    room: RoomDto;
  }) {
    this.canvas = data.canvas;
    this.scenarios = data.scenarios;
    this.room = data.room;
  }
}
