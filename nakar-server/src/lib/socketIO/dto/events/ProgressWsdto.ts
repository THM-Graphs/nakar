import { ApiProperty } from '@nestjs/swagger';

export class ProgressWsdto {
  @ApiProperty({ enum: ['ProgressWsdto'] })
  public type: 'ProgressWsdto';

  @ApiProperty({ type: 'number', nullable: true })
  public progress: number | null;

  @ApiProperty()
  public message: string;

  public constructor(data: {
    type: 'ProgressWsdto';
    progress: number | null;
    message: string;
  }) {
    this.type = data.type;
    this.progress = data.progress;
    this.message = data.message;
  }
}
