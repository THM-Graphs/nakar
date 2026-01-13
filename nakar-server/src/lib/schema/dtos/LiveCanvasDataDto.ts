import { LiveCanvasMetaDataDto } from './LiveCanvasMetaDataDto';
import { LiveCanvasTableDataDto } from './LiveCanvasTableDataDto';
import { LiveCanvasViewSettingsDto } from './LiveCanvasViewSettingsDto';
import { LiveCanvasGraphElementsDto } from './LiveCanvasGraphElementsDto';
import { ApiProperty } from '@nestjs/swagger';

export class LiveCanvasDataDto {
  @ApiProperty({ type: LiveCanvasMetaDataDto })
  public metaData: LiveCanvasMetaDataDto;

  @ApiProperty({ type: LiveCanvasGraphElementsDto })
  public elements: LiveCanvasGraphElementsDto;

  @ApiProperty({ type: LiveCanvasTableDataDto })
  public table: LiveCanvasTableDataDto;

  @ApiProperty({ type: LiveCanvasViewSettingsDto })
  public viewSettings: LiveCanvasViewSettingsDto;

  public constructor(data: {
    metaData: LiveCanvasMetaDataDto;
    elements: LiveCanvasGraphElementsDto;
    table: LiveCanvasTableDataDto;
    viewSettings: LiveCanvasViewSettingsDto;
  }) {
    this.metaData = data.metaData;
    this.elements = data.elements;
    this.table = data.table;
    this.viewSettings = data.viewSettings;
  }
}
