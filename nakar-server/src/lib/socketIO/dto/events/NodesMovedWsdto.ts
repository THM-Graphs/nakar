import { PhysicalNodeDto } from '../types/PhysicalNodeDto';
import { PhysicsPerformanceDto } from '../types/PhysicsPerformanceDto';
import { ApiProperty } from '@nestjs/swagger';

export class NodesMovedWsdto {
  @ApiProperty({ enum: ['NodesMovedWsdto'] })
  public type: 'NodesMovedWsdto';

  @ApiProperty({ type: [PhysicalNodeDto] })
  public nodes: PhysicalNodeDto[];

  @ApiProperty()
  public date: string;

  @ApiProperty({ type: PhysicsPerformanceDto })
  public performance: PhysicsPerformanceDto;

  public constructor(data: {
    type: 'NodesMovedWsdto';
    nodes: PhysicalNodeDto[];
    date: string;
    performance: PhysicsPerformanceDto;
  }) {
    this.type = data.type;
    this.nodes = data.nodes;
    this.date = data.date;
    this.performance = data.performance;
  }
}
