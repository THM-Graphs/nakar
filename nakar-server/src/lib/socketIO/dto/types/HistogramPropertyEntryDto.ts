import { HistogramValueEntryDto } from './HistogramValueEntryDto';
import { ApiProperty } from '@nestjs/swagger';

export class HistogramPropertyEntryDto {
  @ApiProperty()
  public key: string;

  @ApiProperty({ type: HistogramValueEntryDto, isArray: true })
  public values: HistogramValueEntryDto[];

  public constructor(data: { key: string; values: HistogramValueEntryDto[] }) {
    this.key = data.key;
    this.values = data.values;
  }
}
