import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateCommonPropertyRequestBodyDto {
  @ApiProperty()
  @IsString()
  public leftLabel!: string;

  @ApiProperty()
  @IsString()
  public leftProperty!: string;

  @ApiProperty()
  @IsString()
  public rightLabel!: string;

  @ApiProperty()
  @IsString()
  public rightProperty!: string;

  @ApiProperty()
  @IsString()
  public leftDatabaseId!: string;

  @ApiProperty()
  @IsString()
  public rightDatabaseId!: string;
}
