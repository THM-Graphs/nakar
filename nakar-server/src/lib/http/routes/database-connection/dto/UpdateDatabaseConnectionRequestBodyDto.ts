import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UpdateNodeConfigurationRequestBodyDto } from './UpdateNodeConfigurationRequestBodyDto';
import { Type } from 'class-transformer';

export class UpdateDatabaseConnectionRequestBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  public title!: string;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public username!: string | null;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public password!: string | null;

  @ApiProperty()
  @IsString()
  public database!: string;

  @ApiProperty()
  @IsString()
  public connectionUrl!: string;

  @ApiProperty()
  @IsString()
  public browserUrl!: string;

  @ApiProperty()
  @IsBoolean()
  public credentialStoreConsent!: boolean;

  @ApiProperty({ type: UpdateNodeConfigurationRequestBodyDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(
    (): typeof UpdateNodeConfigurationRequestBodyDto =>
      UpdateNodeConfigurationRequestBodyDto,
  )
  @IsArray()
  public nodeConfigurations!: UpdateNodeConfigurationRequestBodyDto[];
}
