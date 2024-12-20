import { NodeDto } from './NodeDto';
import { EdgeDto } from './EdgeDto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GraphDto {
  @Type(() => NodeDto)
  @ApiProperty({ type: NodeDto, isArray: true })
  public nodes: NodeDto[];

  @Type(() => EdgeDto)
  @ApiProperty({ type: EdgeDto, isArray: true })
  public edges: EdgeDto[];

  constructor(nodes: NodeDto[], edges: EdgeDto[]) {
    this.nodes = nodes;
    this.edges = edges;
  }
}
