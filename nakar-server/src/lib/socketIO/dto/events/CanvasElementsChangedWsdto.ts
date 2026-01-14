import { LiveCanvasGraphElementsDto } from '../../../schema/dtos/LiveCanvasGraphElementsDto';
import { ApiProperty } from '@nestjs/swagger';

export class CanvasElementsChangedWsdto {
  @ApiProperty({ enum: ['CanvasElementsChangedWsdto'] })
  public type: 'CanvasElementsChangedWsdto';

  @ApiProperty({ type: LiveCanvasGraphElementsDto })
  public elements: LiveCanvasGraphElementsDto;

  public constructor(data: {
    type: 'CanvasElementsChangedWsdto';
    elements: LiveCanvasGraphElementsDto;
  }) {
    this.type = data.type;
    this.elements = data.elements;
  }
}
