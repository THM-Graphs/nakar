import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { DatabaseConnectionDatabaseType } from '../DatabaseConnectionDatabaseType';

export abstract class DatabaseConnectionAdapterBaseDto {
  @IsEnum(DatabaseConnectionDatabaseType)
  public databaseType!: DatabaseConnectionDatabaseType;

  @ApiProperty()
  @IsString()
  public connectionUrl!: string;
}
