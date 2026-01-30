import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateScenarioQueryEntryDto {
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
