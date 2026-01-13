import { LiveCanvasMetaDataDto } from '../../../schema/dtos/LiveCanvasMetaDataDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphMetaDataChangedWsdto {
  @ApiProperty({ enum: ['GraphMetaDataChangedWsdto'] })
  public type: 'GraphMetaDataChangedWsdto';

  @ApiProperty({ type: LiveCanvasMetaDataDto })
  public metaData: LiveCanvasMetaDataDto;

  public constructor(data: {
    type: 'GraphMetaDataChangedWsdto';
    metaData: LiveCanvasMetaDataDto;
  }) {
    this.type = data.type;
    this.metaData = data.metaData;
  }
}
