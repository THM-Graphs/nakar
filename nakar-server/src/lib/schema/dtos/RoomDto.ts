import { RoomVisibilityDto } from './RoomVisibilityDto';
import { CanvasDto } from './CanvasDto';
import { ApiProperty } from '@nestjs/swagger';

export class RoomDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ enum: RoomVisibilityDto })
  public visibility: RoomVisibilityDto;

  @ApiProperty({ isArray: true, type: CanvasDto })
  public canvases: CanvasDto[];

  public constructor(data: {
    id: string;
    title: string;
    visibility: RoomVisibilityDto;
    canvases: CanvasDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.visibility = data.visibility;
    this.canvases = data.canvases;
  }
}
