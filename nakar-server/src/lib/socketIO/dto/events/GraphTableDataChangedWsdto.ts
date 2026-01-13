import { LiveCanvasTableDataDto } from '../../../schema/dtos/LiveCanvasTableDataDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphTableDataChangedWsdto {
  @ApiProperty({ enum: ['GraphTableDataChangedWsdto'] })
  public type: 'GraphTableDataChangedWsdto';

  @ApiProperty({ type: LiveCanvasTableDataDto })
  public table: LiveCanvasTableDataDto;

  public constructor(data: {
    type: 'GraphTableDataChangedWsdto';
    tableData: LiveCanvasTableDataDto;
  }) {
    this.type = data.type;
    this.table = data.tableData;
  }
}
