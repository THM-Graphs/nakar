import { ApiProperty } from '@nestjs/swagger';

export class DatabaseStatsLabelDto {
  @ApiProperty()
  public label: string;

  @ApiProperty()
  public exploreQuery: string;

  public constructor(data: { label: string; exploreQuery: string }) {
    this.label = data.label;
    this.exploreQuery = data.exploreQuery;
  }
}
