import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { DatabaseConnectionDatabaseType } from '../../database-connection/dto/DatabaseConnectionDatabaseType';
import { wikidataLanguagePattern } from '../../../../external-database/adapters/wikidata/WikidataLanguagePattern';

export class TestDatabaseConnectionRequestBodyDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public projectId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public databaseConnectionId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public username!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public password!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public database!: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  public connectionUrl!: string;

  @ApiProperty({ enum: DatabaseConnectionDatabaseType })
  @IsEnum(DatabaseConnectionDatabaseType)
  public databaseType!: DatabaseConnectionDatabaseType;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @Matches(wikidataLanguagePattern)
  @IsOptional()
  public language!: string | null;
}
