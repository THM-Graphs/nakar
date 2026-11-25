import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';
import { DatabaseConnectionDatabaseType } from '../DatabaseConnectionDatabaseType';
import { Neo4jCredentialsDto } from './Neo4jCredentialsDto';

export class Neo4jDatabaseConnectionAdapterDto extends Neo4jCredentialsDto {
  @ApiProperty({ enum: [DatabaseConnectionDatabaseType.neo4j] })
  @Equals(DatabaseConnectionDatabaseType.neo4j)
  declare public databaseType: DatabaseConnectionDatabaseType.neo4j;
}
