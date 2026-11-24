import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RamenEdgeTitleRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public annotationType!: string;

  @ApiProperty()
  @IsString()
  public titleProperty!: string;
}
