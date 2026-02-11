import { UserPreviewDto } from '../../../../schema/dtos/UserPreviewDto';
import { DatabaseConnectionDto } from '../../../../schema/dtos/DatabaseConnectionDto';
import { ScenarioGroupDto } from '../../../../schema/dtos/ScenarioGroupDto';
import { RoomDto } from '../../../../schema/dtos/RoomDto';
import { ApiProperty } from '@nestjs/swagger';
import { CommonPropertyDto } from '../../../../schema/dtos/CommonPropertyDto';

export class ProjectPageDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ type: UserPreviewDto, nullable: true })
  public owner: UserPreviewDto | null;

  @ApiProperty({ isArray: true, type: UserPreviewDto })
  public collaborators: UserPreviewDto[];

  @ApiProperty({ isArray: true, type: DatabaseConnectionDto })
  public databases: DatabaseConnectionDto[];

  @ApiProperty({ isArray: true, type: ScenarioGroupDto })
  public scenarioGroups: ScenarioGroupDto[];

  @ApiProperty({ isArray: true, type: RoomDto })
  public rooms: RoomDto[];

  @ApiProperty({ isArray: true, type: CommonPropertyDto })
  public commonProperties: CommonPropertyDto[];

  public constructor(data: {
    id: string;
    title: string;
    owner: UserPreviewDto | null;
    collaborators: UserPreviewDto[];
    databases: DatabaseConnectionDto[];
    scenarioGroups: ScenarioGroupDto[];
    rooms: RoomDto[];
    commonProperties: CommonPropertyDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.owner = data.owner;
    this.collaborators = data.collaborators;
    this.databases = data.databases;
    this.scenarioGroups = data.scenarioGroups;
    this.rooms = data.rooms;
    this.commonProperties = data.commonProperties;
  }
}
