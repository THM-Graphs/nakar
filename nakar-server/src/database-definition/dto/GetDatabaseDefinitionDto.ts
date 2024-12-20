import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetDatabaseDefinitionDto {
  @ApiProperty({ example: 57382 })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'POSE Database' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'localhost' })
  @IsString()
  host: string;

  @ApiProperty({ example: 7548 })
  @IsNumber()
  port: number;

  @ApiProperty({ example: 'neo4j' })
  @IsString()
  username: string;

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
    host: string,
    port: number,
    username: string,
    createDate: Date,
    updateDate: Date,
    version: number,
  ) {
    this.id = id;
    this.title = title;
    this.host = host;
    this.port = port;
    this.username = username;
    this.createDate = createDate;
    this.updateDate = updateDate;
    this.version = version;
  }
}
