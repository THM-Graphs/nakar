import { ApiProperty } from '@nestjs/swagger';

export class DatabaseStatsRelationshipDto {
  @ApiProperty()
  public relType: string;

  @ApiProperty()
  public exploreQuery: string;

  public constructor(data: { relType: string; exploreQuery: string }) {
    this.relType = data.relType;
    this.exploreQuery = data.exploreQuery;
  }
}
