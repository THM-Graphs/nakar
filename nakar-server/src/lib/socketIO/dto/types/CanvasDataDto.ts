import { GraphMetaDataDto } from './GraphMetaDataDto';
import { TableDataDto } from './TableDataDto';
import { LiveCanvasViewSettingsDto } from '../../../http/dto/LiveCanvasViewSettingsDto';
import { GraphElementsDto } from './GraphElementsDto';
import { ApiProperty } from '@nestjs/swagger';

export class CanvasDataDto {
  @ApiProperty({ type: GraphMetaDataDto })
  public metaData: GraphMetaDataDto;

  @ApiProperty({ type: GraphElementsDto })
  public elements: GraphElementsDto;

  @ApiProperty({ type: TableDataDto })
  public table: TableDataDto;

  @ApiProperty({ type: LiveCanvasViewSettingsDto })
  public viewSettings: LiveCanvasViewSettingsDto;

  public constructor(data: {
    metaData: GraphMetaDataDto;
    elements: GraphElementsDto;
    table: TableDataDto;
    viewSettings: LiveCanvasViewSettingsDto;
  }) {
    this.metaData = data.metaData;
    this.elements = data.elements;
    this.table = data.table;
    this.viewSettings = data.viewSettings;
  }
}
