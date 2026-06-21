import { SearchCapabilitiesEntryDto } from './SearchCapabilitiesEntryDto';
import { ApiProperty } from '@nestjs/swagger';

export class GetSearchCapabilitiesResponseBodyDto {
  @ApiProperty()
  public canExactMatchNativeId: boolean;

  @ApiProperty()
  public canExactMatchLabel: boolean;

  @ApiProperty({ isArray: true, type: SearchCapabilitiesEntryDto })
  public exactMatchNodeProperties: SearchCapabilitiesEntryDto[];

  @ApiProperty({ isArray: true, type: SearchCapabilitiesEntryDto })
  public fuzzyMatchNodeProperties: SearchCapabilitiesEntryDto[];

  public constructor(data: {
    canExactMatchNativeId: boolean;
    canExactMatchLabel: boolean;
    exactMatchNodeProperties: SearchCapabilitiesEntryDto[];
    fuzzyMatchNodeProperties: SearchCapabilitiesEntryDto[];
  }) {
    this.canExactMatchNativeId = data.canExactMatchNativeId;
    this.canExactMatchLabel = data.canExactMatchLabel;
    this.exactMatchNodeProperties = data.exactMatchNodeProperties;
    this.fuzzyMatchNodeProperties = data.fuzzyMatchNodeProperties;
  }
}
