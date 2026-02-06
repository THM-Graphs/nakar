import { DatabaseStatsLabelDto } from './DatabaseStatsLabelDto';
import { DatabaseStatsRelationshipDto } from './DatabaseStatsRelationshipDto';
import { ApiProperty } from '@nestjs/swagger';

export class GetDatabaseStatsResponseBodyDto {
  @ApiProperty()
  public relTypeCount: number;

  @ApiProperty()
  public labelCount: number;

  @ApiProperty()
  public relCount: number;

  @ApiProperty({ isArray: true, type: DatabaseStatsLabelDto })
  public labels: DatabaseStatsLabelDto[];

  @ApiProperty({ isArray: true, type: DatabaseStatsRelationshipDto })
  public rels: DatabaseStatsRelationshipDto[];

  @ApiProperty()
  public nodeCount: number;

  public constructor(data: {
    relTypeCount: number;
    labelCount: number;
    relCount: number;
    labels: DatabaseStatsLabelDto[];
    rels: DatabaseStatsRelationshipDto[];
    nodeCount: number;
  }) {
    this.relTypeCount = data.relTypeCount;
    this.labelCount = data.labelCount;
    this.relCount = data.relCount;
    this.labels = data.labels;
    this.rels = data.rels;
    this.nodeCount = data.nodeCount;
  }
}
