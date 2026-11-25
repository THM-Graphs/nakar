import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { DatabaseConnectionAdapterBaseDto } from './DatabaseConnectionAdapterBaseDto';

export abstract class Neo4jCredentialsDto extends DatabaseConnectionAdapterBaseDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public username?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public password?: string | null;

  @ApiProperty()
  @IsString()
  public database!: string;
}
