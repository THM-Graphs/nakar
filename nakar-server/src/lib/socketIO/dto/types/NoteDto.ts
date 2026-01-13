import { UserPreviewDto } from '../../../http/dto/UserPreviewDto';
import { ColorDto } from '../../../http/dto/ColorDto';
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

  @ApiProperty({ type: ColorDto, nullable: true })
  public color: ColorDto | null;

  public constructor(data: {
    id: string;
    content: string;
    nodes: NodePreviewDto[];
    author: UserPreviewDto | null;
    dateTime: string;
    color: ColorDto | null;
  }) {
    this.id = data.id;
    this.content = data.content;
    this.nodes = data.nodes;
    this.author = data.author;
    this.dateTime = data.dateTime;
    this.color = data.color;
  }
}
