import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoadNodeRequestBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  public nodeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  public databaseId!: string;
}
