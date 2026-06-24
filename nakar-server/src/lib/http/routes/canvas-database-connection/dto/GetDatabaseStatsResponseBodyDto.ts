import { DatabaseStatsLabelDto } from './DatabaseStatsLabelDto';
import { DatabaseStatsRelationshipDto } from './DatabaseStatsRelationshipDto';
import { ApiProperty } from '@nestjs/swagger';

export class GetDatabaseStatsResponseBodyDto {
  @ApiProperty({ nullable: true, type: Number })
  public relTypeCount: number | null;

  @ApiProperty({ nullable: true, type: Number })
  public labelCount: number | null;

  @ApiProperty({ nullable: true, type: Number })
  public relCount: number | null;

  @ApiProperty({ isArray: true, type: DatabaseStatsLabelDto, nullable: true })
  public labels: DatabaseStatsLabelDto[] | null;

  @ApiProperty({
    isArray: true,
    type: DatabaseStatsRelationshipDto,
    nullable: true,
  })
  public rels: DatabaseStatsRelationshipDto[] | null;

  @ApiProperty({ nullable: true, type: Number })
  public nodeCount: number | null;

  public constructor(data: {
    relTypeCount: number | null;
    labelCount: number | null;
    relCount: number | null;
    labels: DatabaseStatsLabelDto[] | null;
    rels: DatabaseStatsRelationshipDto[] | null;
    nodeCount: number | null;
  }) {
    this.relTypeCount = data.relTypeCount;
    this.labelCount = data.labelCount;
    this.relCount = data.relCount;
    this.labels = data.labels;
    this.rels = data.rels;
    this.nodeCount = data.nodeCount;
  }
}
