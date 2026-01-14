import { LiveCanvasTableDataDto } from '../../../schema/dtos/LiveCanvasTableDataDto';
import { ApiProperty } from '@nestjs/swagger';

export class CanvasTableDataChangedWsdto {
  @ApiProperty({ enum: ['CanvasTableDataChangedWsdto'] })
  public type: 'CanvasTableDataChangedWsdto';

  @ApiProperty({ type: LiveCanvasTableDataDto })
  public table: LiveCanvasTableDataDto;

  public constructor(data: {
    type: 'CanvasTableDataChangedWsdto';
    tableData: LiveCanvasTableDataDto;
  }) {
    this.type = data.type;
    this.table = data.tableData;
  }
}
