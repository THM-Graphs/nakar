import { ApiProperty } from '@nestjs/swagger';

export class ExpandNodePreviewEntryDto {
  @ApiProperty({ type: String })
  public identificator: string;

  @ApiProperty({ type: String })
  public title: string;

  @ApiProperty({ type: Number })
  public count: number;

  public constructor(data: {
    identificator: string;
    title: string;
    count: number;
  }) {
    this.identificator = data.identificator;
    this.title = data.title;
    this.count = data.count;
  }
}
