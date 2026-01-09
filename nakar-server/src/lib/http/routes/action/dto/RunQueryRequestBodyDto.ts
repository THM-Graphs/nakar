import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunQueryRequestBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  public databaseId!: string;

  @ApiProperty({ type: String })
  @IsString()
  public query!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public replace!: boolean;
}
