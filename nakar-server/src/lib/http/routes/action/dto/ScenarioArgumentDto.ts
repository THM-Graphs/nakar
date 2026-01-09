import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ScenarioArgumentDto {
  @ApiProperty({ type: String })
  @IsString()
  public identifier!: string;

  @ApiProperty({ type: String })
  @IsString()
  public value!: string;
}
