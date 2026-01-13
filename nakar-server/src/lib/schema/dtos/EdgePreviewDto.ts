import { ApiProperty } from '@nestjs/swagger';

export class EdgePreviewDto {
  @ApiProperty()
  public type: string;

  @ApiProperty()
  public count: number;

  @ApiProperty()
  public percentage: number;

  public constructor(data: {
    type: string;
    count: number;
    percentage: number;
  }) {
    this.type = data.type;
    this.count = data.count;
    this.percentage = data.percentage;
  }
}
