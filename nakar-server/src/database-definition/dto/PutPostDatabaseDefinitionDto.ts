import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PutPostDatabaseDefinitionDto {
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

  @ApiProperty({ example: '12345678' })
  @IsString()
  password: string;

  constructor(
    title: string,
    host: string,
    port: number,
    username: string,
    password: string,
  ) {
    this.title = title;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }
}
