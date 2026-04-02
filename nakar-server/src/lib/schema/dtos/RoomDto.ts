import { RoomVisibilityDto } from './RoomVisibilityDto';
import { CanvasDto } from './CanvasDto';
import { ApiProperty } from '@nestjs/swagger';
import { DatabaseConnectionDto } from './DatabaseConnectionDto';
import { UserPreviewDto } from './UserPreviewDto';

export class RoomDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ enum: RoomVisibilityDto })
  public visibility: RoomVisibilityDto;

  @ApiProperty({ isArray: true, type: CanvasDto })
  public canvases: CanvasDto[];

  @ApiProperty()
  public joinCanvasId: string;

  @ApiProperty({ type: String })
  public projectId: string;

  @ApiProperty({ isArray: true, type: DatabaseConnectionDto })
  public databases: DatabaseConnectionDto[];

  @ApiProperty({ type: UserPreviewDto, isArray: true })
  public activeUsers: UserPreviewDto[];

  public constructor(data: {
    id: string;
    title: string;
    visibility: RoomVisibilityDto;
    canvases: CanvasDto[];
    joinCanvasId: string;
    projectId: string;
    databases: DatabaseConnectionDto[];
    activeUsers: UserPreviewDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.visibility = data.visibility;
    this.canvases = data.canvases;
    this.joinCanvasId = data.joinCanvasId;
    this.projectId = data.projectId;
    this.databases = data.databases;
    this.activeUsers = data.activeUsers;
  }
}
