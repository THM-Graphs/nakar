import { LiveCanvasGraphElementsDto } from '../../../schema/dtos/LiveCanvasGraphElementsDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphElementsChangedWsdto {
  @ApiProperty({ enum: ['GraphElementsChangedWsdto'] })
  public type: 'GraphElementsChangedWsdto';

  @ApiProperty({ type: LiveCanvasGraphElementsDto })
  public elements: LiveCanvasGraphElementsDto;

  public constructor(data: {
    type: 'GraphElementsChangedWsdto';
    elements: LiveCanvasGraphElementsDto;
  }) {
    this.type = data.type;
    this.elements = data.elements;
  }
}
