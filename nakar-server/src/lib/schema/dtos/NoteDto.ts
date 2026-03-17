import { UserPreviewDto } from './UserPreviewDto';
import { NodePreviewDto } from './NodePreviewDto';
import { ApiProperty } from '@nestjs/swagger';

export class NoteDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public content: string;

  @ApiProperty({ type: NodePreviewDto, isArray: true })
  public nodes: NodePreviewDto[];

  @ApiProperty({ type: UserPreviewDto, nullable: true })
  public author: UserPreviewDto | null;

  @ApiProperty()
  public dateTime: string;

  public constructor(data: {
    id: string;
    content: string;
    nodes: NodePreviewDto[];
    author: UserPreviewDto | null;
    dateTime: string;
  }) {
    this.id = data.id;
    this.content = data.content;
    this.nodes = data.nodes;
    this.author = data.author;
    this.dateTime = data.dateTime;
  }
}
