import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthWsdto {
  @ApiProperty()
  @IsString()
  public jwt!: string;

  @ApiProperty()
  @IsString()
  public canvasId!: string;
}
