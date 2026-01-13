import { GraphMetaDataDto } from '../types/GraphMetaDataDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphMetaDataChangedWsdto {
  @ApiProperty({ enum: ['GraphMetaDataChangedWsdto'] })
  public type: 'GraphMetaDataChangedWsdto';

  @ApiProperty({ type: GraphMetaDataDto })
  public metaData: GraphMetaDataDto;

  public constructor(data: {
    type: 'GraphMetaDataChangedWsdto';
    metaData: GraphMetaDataDto;
  }) {
    this.type = data.type;
    this.metaData = data.metaData;
  }
}
