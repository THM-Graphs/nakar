import { ApiProperty } from '@nestjs/swagger';

export class PhysicsPerformanceDto {
  @ApiProperty({ enum: ['good', 'bad'] })
  public performance: 'good' | 'bad';

  @ApiProperty()
  public loadPercent: number;

  @ApiProperty()
  public tickDuration: number;

  @ApiProperty()
  public tickCount: number;

  public constructor(data: {
    performance: 'good' | 'bad';
    loadPercent: number;
    tickDuration: number;
    tickCount: number;
  }) {
    this.performance = data.performance;
    this.loadPercent = data.loadPercent;
    this.tickDuration = data.tickDuration;
    this.tickCount = data.tickCount;
  }
}
