import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DatabaseConnectionDatabaseType } from './DatabaseConnectionDatabaseType';

export class TestDatabaseConnectionRequestBodyDto {
  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public id!: string | null;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public username!: string | null;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public password!: string | null;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public database!: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  public connectionUrl!: string;

  @ApiProperty({ enum: DatabaseConnectionDatabaseType })
  @IsEnum(DatabaseConnectionDatabaseType)
  public databaseType!: DatabaseConnectionDatabaseType;
}
