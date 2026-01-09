import { ApiProperty } from '@nestjs/swagger';

export class ExpandNodePreviewEntryDto {
  @ApiProperty({ type: String })
  public identificator: string;

  @ApiProperty({ type: Number })
  public count: number;

  public constructor(data: { identificator: string; count: number }) {
    this.identificator = data.identificator;
    this.count = data.count;
  }
}
