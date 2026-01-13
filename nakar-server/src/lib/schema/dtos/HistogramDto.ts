import { HistogramValueEntryDto } from './HistogramValueEntryDto';
import { HistogramNodeEntryDto } from './HistogramNodeEntryDto';
import { HistogramPropertyEntryDto } from './HistogramPropertyEntryDto';
import { ApiProperty } from '@nestjs/swagger';

export class HistogramDto {
  @ApiProperty({ type: [HistogramValueEntryDto] })
  public nodeLabels: HistogramValueEntryDto[];

  @ApiProperty({ type: [HistogramPropertyEntryDto] })
  public nodeProperties: HistogramPropertyEntryDto[];

  @ApiProperty({ type: [HistogramValueEntryDto] })
  public edgeTypes: HistogramValueEntryDto[];

  @ApiProperty({ type: [HistogramPropertyEntryDto] })
  public edgeProperties: HistogramPropertyEntryDto[];

  @ApiProperty({ type: [HistogramNodeEntryDto] })
  public nodes: HistogramNodeEntryDto[];

  public constructor(data: {
    nodeLabels: HistogramValueEntryDto[];
    nodeProperties: HistogramPropertyEntryDto[];
    edgeTypes: HistogramValueEntryDto[];
    edgeProperties: HistogramPropertyEntryDto[];
    nodes: HistogramNodeEntryDto[];
  }) {
    this.nodeLabels = data.nodeLabels;
    this.nodeProperties = data.nodeProperties;
    this.edgeTypes = data.edgeTypes;
    this.edgeProperties = data.edgeProperties;
    this.nodes = data.nodes;
  }
}
