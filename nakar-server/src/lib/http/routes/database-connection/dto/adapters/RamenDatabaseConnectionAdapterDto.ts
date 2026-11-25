import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Equals, IsArray, IsObject, ValidateNested } from 'class-validator';
import { DatabaseConnectionDatabaseType } from '../DatabaseConnectionDatabaseType';
import { RamenEdgeTitleRuleDto } from '../RamenEdgeTitleRuleDto';
import { Neo4jCredentialsDto } from './Neo4jCredentialsDto';

export class RamenDatabaseConnectionAdapterDto extends Neo4jCredentialsDto {
  @ApiProperty({ enum: [DatabaseConnectionDatabaseType.ramen] })
  @Equals(DatabaseConnectionDatabaseType.ramen)
  declare public databaseType: DatabaseConnectionDatabaseType.ramen;

  @ApiProperty({ type: RamenEdgeTitleRuleDto, isArray: true })
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type((): typeof RamenEdgeTitleRuleDto => RamenEdgeTitleRuleDto)
  public ramenEdgeTitleRules!: RamenEdgeTitleRuleDto[];
}
