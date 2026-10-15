import { ApiProperty } from '@nestjs/swagger';

export class HistogramValueEntryDto {
  @ApiProperty()
  public value: string;

  @ApiProperty()
  public count: number;

  @ApiProperty()
  public percentage: number;

  @ApiProperty({ type: [String] })
  public elementIds: string[];

  public constructor(data: {
    value: string;
    count: number;
    percentage: number;
    elementIds: string[];
  }) {
    this.value = data.value;
    this.count = data.count;
    this.percentage = data.percentage;
    this.elementIds = data.elementIds;
  }
}
