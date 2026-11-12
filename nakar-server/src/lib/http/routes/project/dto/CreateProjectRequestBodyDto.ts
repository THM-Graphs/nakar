import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpdateDatabaseConnectionRequestBodyDto } from '../../database-connection/dto/UpdateDatabaseConnectionRequestBodyDto';

export class CreateProjectRequestBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public title!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public createDemoScenarios!: boolean;

  @ApiPropertyOptional({ type: UpdateDatabaseConnectionRequestBodyDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(
    (): typeof UpdateDatabaseConnectionRequestBodyDto =>
      UpdateDatabaseConnectionRequestBodyDto,
  )
  public databaseConnection?: UpdateDatabaseConnectionRequestBodyDto;
}
