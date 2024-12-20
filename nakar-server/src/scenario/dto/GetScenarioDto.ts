import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

  @ApiProperty({ example: '2024-12-20T15:46:28.000Z' })
  @IsDate()
  createDate: Date;

  @ApiProperty({ example: '2024-12-20T15:46:28.000Z' })
  @IsDate()
  updateDate: Date;

  @ApiProperty({ example: 1 })
  @IsInt()
  version: number;

  constructor(
    id: number,
    title: string,
    query: string,
    databaseDefinitionId: number,
    createDate: Date,
    updateDate: Date,
    version: number,
  ) {
    this.id = id;
    this.title = title;
    this.query = query;
    this.databaseDefinitionId = databaseDefinitionId;
    this.createDate = createDate;
    this.updateDate = updateDate;
    this.version = version;
  }
}
