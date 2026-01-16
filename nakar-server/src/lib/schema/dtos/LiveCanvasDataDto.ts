import { LiveCanvasMetaDataDto } from './LiveCanvasMetaDataDto';
import { LiveCanvasTableDataDto } from './LiveCanvasTableDataDto';
import { LiveCanvasViewSettingsDto } from './LiveCanvasViewSettingsDto';
import { LiveCanvasGraphElementsDto } from './LiveCanvasGraphElementsDto';
import { ApiProperty } from '@nestjs/swagger';
import { HistogramDto } from './HistogramDto';
import { NoteDto } from './NoteDto';

export class LiveCanvasDataDto {
  @ApiProperty({ type: LiveCanvasMetaDataDto })
  public metaData: LiveCanvasMetaDataDto;

  @ApiProperty({ type: LiveCanvasGraphElementsDto })
  public elements: LiveCanvasGraphElementsDto;

  @ApiProperty({ type: LiveCanvasTableDataDto })
  public table: LiveCanvasTableDataDto;

  @ApiProperty({ type: LiveCanvasViewSettingsDto })
  public viewSettings: LiveCanvasViewSettingsDto;

  @ApiProperty({ type: HistogramDto })
  public histogram: HistogramDto;

  @ApiProperty({ type: [NoteDto] })
  public notes: NoteDto[];

  public constructor(data: {
    metaData: LiveCanvasMetaDataDto;
    elements: LiveCanvasGraphElementsDto;
    table: LiveCanvasTableDataDto;
    viewSettings: LiveCanvasViewSettingsDto;
    histogram: HistogramDto;
    notes: NoteDto[];
  }) {
    this.metaData = data.metaData;
    this.elements = data.elements;
    this.table = data.table;
    this.viewSettings = data.viewSettings;
    this.histogram = data.histogram;
    this.notes = data.notes;
  }
}
