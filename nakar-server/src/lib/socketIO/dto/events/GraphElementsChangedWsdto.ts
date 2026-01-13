import { GraphElementsDto } from '../types/GraphElementsDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphElementsChangedWsdto {
  @ApiProperty({ enum: ['GraphElementsChangedWsdto'] })
  public type: 'GraphElementsChangedWsdto';

  @ApiProperty({ type: GraphElementsDto })
  public elements: GraphElementsDto;

  public constructor(data: {
    type: 'GraphElementsChangedWsdto';
    elements: GraphElementsDto;
  }) {
    this.type = data.type;
    this.elements = data.elements;
  }
}
