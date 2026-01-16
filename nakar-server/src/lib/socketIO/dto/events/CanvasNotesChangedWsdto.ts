import { ApiProperty } from '@nestjs/swagger';
import { NoteDto } from '../../../schema/dtos/NoteDto';

export class CanvasNotesChangedWsdto {
  @ApiProperty({ enum: ['CanvasNotesChangedWsdto'] })
  public type: 'CanvasNotesChangedWsdto';

  @ApiProperty({ type: NoteDto, isArray: true })
  public notes: NoteDto[];

  public constructor(data: {
    type: 'CanvasNotesChangedWsdto';
    notes: NoteDto[];
  }) {
    this.type = data.type;
    this.notes = data.notes;
  }
}
