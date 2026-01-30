import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateScenarioGroupRequestBodyDto {
  @ApiProperty()
  @IsString()
  public title!: string;
}
