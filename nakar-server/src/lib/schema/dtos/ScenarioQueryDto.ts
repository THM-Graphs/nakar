import { DatabaseConnectionDto } from './DatabaseConnectionDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioQueryDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public query: string;

  @ApiProperty({ type: DatabaseConnectionDto, nullable: true })
  public database: DatabaseConnectionDto | null;

  @ApiProperty()
  public isTableQuery: boolean;

  public constructor(data: {
    id: string;
    query: string;
    database: DatabaseConnectionDto | null;
    isTableQuery: boolean;
  }) {
    this.id = data.id;
    this.query = data.query;
    this.database = data.database;
    this.isTableQuery = data.isTableQuery;
  }
}
