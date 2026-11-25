import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';
import { DatabaseConnectionDatabaseType } from '../DatabaseConnectionDatabaseType';
import { DatabaseConnectionAdapterBaseDto } from './DatabaseConnectionAdapterBaseDto';

export class SparqlDatabaseConnectionAdapterDto extends DatabaseConnectionAdapterBaseDto {
  @ApiProperty({ enum: [DatabaseConnectionDatabaseType.sparql] })
  @Equals(DatabaseConnectionDatabaseType.sparql)
  declare public databaseType: DatabaseConnectionDatabaseType.sparql;
}
