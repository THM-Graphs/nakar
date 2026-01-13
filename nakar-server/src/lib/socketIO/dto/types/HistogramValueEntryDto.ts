import { ApiProperty } from '@nestjs/swagger';

export class HistogramValueEntryDto {
  @ApiProperty()
  public value: string;

  @ApiProperty()
  public count: number;

  @ApiProperty()
  public percentage: number;

  public constructor(data: {
    value: string;
    count: number;
    percentage: number;
  }) {
    this.value = data.value;
    this.count = data.count;
    this.percentage = data.percentage;
  }
}
