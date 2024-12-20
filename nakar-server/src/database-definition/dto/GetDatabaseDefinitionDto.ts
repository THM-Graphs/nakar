import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

  constructor(
    id: number,
    title: string,
    host: string,
    port: number,
    username: string,
  ) {
    this.id = id;
    this.title = title;
    this.host = host;
    this.port = port;
    this.username = username;
  }
}
