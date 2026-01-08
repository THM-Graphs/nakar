import { RoomVisibilityDto } from '../../dto/RoomVisibilityDto';
import { ApiProperty } from '@nestjs/swagger';

export class StartPageRoomDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ enum: RoomVisibilityDto })
  public visibility: RoomVisibilityDto;

  @ApiProperty()
  public projectTitle: string;

  public constructor(data: {
    id: string;
    title: string;
    visibility: RoomVisibilityDto;
    projectTitle: string;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.visibility = data.visibility;
    this.projectTitle = data.projectTitle;
  }
}
