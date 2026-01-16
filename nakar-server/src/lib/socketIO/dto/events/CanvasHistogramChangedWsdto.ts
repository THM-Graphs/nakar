import { ApiProperty } from '@nestjs/swagger';
import { HistogramDto } from '../../../schema/dtos/HistogramDto';

export class CanvasHistogramChangedWsdto {
  @ApiProperty({ enum: ['CanvasHistogramChangedWsdto'] })
  public type: 'CanvasHistogramChangedWsdto';

  @ApiProperty({ type: HistogramDto })
  public histogram: HistogramDto;

  public constructor(data: {
    type: 'CanvasHistogramChangedWsdto';
    histogram: HistogramDto;
  }) {
    this.type = data.type;
    this.histogram = data.histogram;
  }
}
