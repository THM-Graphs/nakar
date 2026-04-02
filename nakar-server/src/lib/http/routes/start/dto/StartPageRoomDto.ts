import { RoomVisibilityDto } from '../../../../schema/dtos/RoomVisibilityDto';
import { ApiProperty } from '@nestjs/swagger';
import { UserPreviewDto } from '../../../../schema/dtos/UserPreviewDto';

export class StartPageRoomDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ enum: RoomVisibilityDto })
  public visibility: RoomVisibilityDto;

  @ApiProperty()
  public joinCanvasId: string;

  @ApiProperty({ type: UserPreviewDto, isArray: true })
  public activeUsers: UserPreviewDto[];

  public constructor(data: {
    id: string;
    title: string;
    visibility: RoomVisibilityDto;
    joinCanvasId: string;
    activeUsers: UserPreviewDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.visibility = data.visibility;
    this.joinCanvasId = data.joinCanvasId;
    this.activeUsers = data.activeUsers;
  }
}
