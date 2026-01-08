import { NodePreviewDto } from '../../../dto/NodePreviewDto';
import { ApiProperty } from '@nestjs/swagger';

export class PostSearchResponseBodyDto {
  @ApiProperty({ isArray: true, type: NodePreviewDto })
  public nodes: NodePreviewDto[];

  public constructor(data: { nodes: NodePreviewDto[] }) {
    this.nodes = data.nodes;
  }
}
