import { DatabaseConnectionDto } from './DatabaseConnectionDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioQueryDto {
  @ApiProperty()
  public query: string;

  @ApiProperty({ type: DatabaseConnectionDto, nullable: true })
  public database: DatabaseConnectionDto | null;

  public constructor(data: {
    query: string;
    database: DatabaseConnectionDto | null;
  }) {
    this.query = data.query;
    this.database = data.database;
  }
}
