import { StartPageProjectDto } from './StartPageProjectDto';
import { StartPageRoomDto } from './StartPageRoomDto';
import { ApiProperty } from '@nestjs/swagger';

export class StartPageDto {
  @ApiProperty({ isArray: true, type: StartPageProjectDto })
  public myProjects: StartPageProjectDto[];

  @ApiProperty({ isArray: true, type: StartPageProjectDto })
  public collaborationProjects: StartPageProjectDto[];

  @ApiProperty({ isArray: true, type: StartPageRoomDto })
  public recentRooms: StartPageRoomDto[];

  @ApiProperty({ isArray: true, type: StartPageRoomDto })
  public publicRooms: StartPageRoomDto[];

  public constructor(data: {
    myProjects: StartPageProjectDto[];
    collaborationProjects: StartPageProjectDto[];
    recentRooms: StartPageRoomDto[];
    publicRooms: StartPageRoomDto[];
  }) {
    this.myProjects = data.myProjects;
    this.collaborationProjects = data.collaborationProjects;
    this.recentRooms = data.recentRooms;
    this.publicRooms = data.publicRooms;
  }
}
