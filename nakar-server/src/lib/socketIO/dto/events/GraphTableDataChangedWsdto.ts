import { TableDataDto } from '../types/TableDataDto';
import { ApiProperty } from '@nestjs/swagger';

export class GraphTableDataChangedWsdto {
  @ApiProperty({ enum: ['GraphTableDataChangedWsdto'] })
  public type: 'GraphTableDataChangedWsdto';

  @ApiProperty({ type: TableDataDto })
  public table: TableDataDto;

  public constructor(data: {
    type: 'GraphTableDataChangedWsdto';
    tableData: TableDataDto;
  }) {
    this.type = data.type;
    this.table = data.tableData;
  }
}
