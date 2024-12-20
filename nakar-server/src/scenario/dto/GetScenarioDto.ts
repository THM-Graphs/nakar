import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetScenarioDto {
  @ApiProperty({ example: 57382 })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Common blobs of nodes' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'MATCH ...' })
  @IsString()
  query: string;

  @ApiProperty({ example: 3762 })
  @IsNumber()
  databaseDefinitionId: number;

  constructor(
    id: number,
    title: string,
    query: string,
    databaseDefinitionId: number,
  ) {
    this.id = id;
    this.title = title;
    this.query = query;
    this.databaseDefinitionId = databaseDefinitionId;
  }
}
