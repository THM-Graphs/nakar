import { ApiProperty } from '@nestjs/swagger';

export class SearchCapabilitiesEntryDto {
  @ApiProperty()
  public label: string;

  @ApiProperty()
  public property: string;

  public constructor(data: { label: string; property: string }) {
    this.label = data.label;
    this.property = data.property;
  }
}
