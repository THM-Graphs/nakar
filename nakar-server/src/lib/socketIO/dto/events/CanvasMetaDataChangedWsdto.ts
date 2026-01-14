import { LiveCanvasMetaDataDto } from '../../../schema/dtos/LiveCanvasMetaDataDto';
import { ApiProperty } from '@nestjs/swagger';

export class CanvasMetaDataChangedWsdto {
  @ApiProperty({ enum: ['CanvasMetaDataChangedWsdto'] })
  public type: 'CanvasMetaDataChangedWsdto';

  @ApiProperty({ type: LiveCanvasMetaDataDto })
  public metaData: LiveCanvasMetaDataDto;

  public constructor(data: {
    type: 'CanvasMetaDataChangedWsdto';
    metaData: LiveCanvasMetaDataDto;
  }) {
    this.type = data.type;
    this.metaData = data.metaData;
  }
}
