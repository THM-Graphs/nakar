import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateScenarioQueryEntryDto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty()
  @IsString()
  public query!: string;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public databaseId!: string | null;

  @ApiProperty()
  @IsBoolean()
  public isTableQuery!: boolean;
}
