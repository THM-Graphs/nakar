import { NoteDto } from './NoteDto';
import { NodeDto } from './NodeDto';
import { EdgeDto } from './EdgeDto';
import { LabelDto } from './LabelDto';
import { HistogramDto } from './HistogramDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphElementsDto {
  @ApiProperty({ type: [NodeDto] })
  public nodes: NodeDto[];

  @ApiProperty({ type: [EdgeDto] })
  public edges: EdgeDto[];

  @ApiProperty({ type: [LabelDto] })
  public labels: LabelDto[];

  @ApiProperty({ type: () => HistogramDto })
  public histogram: HistogramDto;

  @ApiProperty({ type: [NoteDto] })
  public notes: NoteDto[];

  public constructor(data: {
    nodes: NodeDto[];
    edges: EdgeDto[];
    labels: LabelDto[];
    histogram: HistogramDto;
    notes: NoteDto[];
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.labels = data.labels;
    this.histogram = data.histogram;
    this.notes = data.notes;
  }
}
