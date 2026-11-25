import { ApiProperty } from '@nestjs/swagger';
import { Equals, Matches, ValidateIf } from 'class-validator';
import { wikidataLanguagePattern } from '../../../../../external-database/adapters/wikidata/WikidataLanguagePattern';
import { DatabaseConnectionDatabaseType } from '../DatabaseConnectionDatabaseType';
import { DatabaseConnectionAdapterBaseDto } from './DatabaseConnectionAdapterBaseDto';

export class WikidataDatabaseConnectionAdapterDto extends DatabaseConnectionAdapterBaseDto {
  @ApiProperty({ enum: [DatabaseConnectionDatabaseType.wikidata] })
  @Equals(DatabaseConnectionDatabaseType.wikidata)
  declare public databaseType: DatabaseConnectionDatabaseType.wikidata;

  @ApiProperty({ nullable: true, type: String })
  @ValidateIf(
    ({ language }: WikidataDatabaseConnectionAdapterDto): boolean =>
      language !== null,
  )
  @Matches(wikidataLanguagePattern)
  public language!: string | null;
}
