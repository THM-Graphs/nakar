import { UserPreviewDto } from '../../../../schema/dtos/UserPreviewDto';
import { DatabaseConnectionDto } from '../../../../schema/dtos/DatabaseConnectionDto';
import { ApiProperty } from '@nestjs/swagger';

export class StartPageProjectDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ nullable: true, type: UserPreviewDto })
  public owner: UserPreviewDto | null;

  @ApiProperty({ isArray: true, type: UserPreviewDto })
  public collaborators: UserPreviewDto[];

  @ApiProperty({ isArray: true, type: DatabaseConnectionDto })
  public databases: DatabaseConnectionDto[];

  @ApiProperty({ type: UserPreviewDto, isArray: true })
  public activeUsers: UserPreviewDto[];

  public constructor(data: {
    id: string;
    title: string;
    owner: UserPreviewDto;
    collaborators: UserPreviewDto[];
    databases: DatabaseConnectionDto[];
    activeUsers: UserPreviewDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.owner = data.owner;
    this.collaborators = data.collaborators;
    this.databases = data.databases;
    this.activeUsers = data.activeUsers;
  }
}
