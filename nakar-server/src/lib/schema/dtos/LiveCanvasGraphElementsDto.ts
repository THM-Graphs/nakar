import { NodeDto } from './NodeDto';
import { EdgeDto } from './EdgeDto';
import { LabelDto } from './LabelDto';
import { ApiProperty } from '@nestjs/swagger';
import { UserPreviewDto } from './UserPreviewDto';

export class LiveCanvasGraphElementsDto {
  @ApiProperty({ type: [NodeDto] })
  public nodes: NodeDto[];

  @ApiProperty({ type: [EdgeDto] })
  public edges: EdgeDto[];

  @ApiProperty({ type: [LabelDto] })
  public labels: LabelDto[];

  public constructor(data: {
    nodes: NodeDto[];
    edges: EdgeDto[];
    labels: LabelDto[];
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.labels = data.labels;
  }
}
