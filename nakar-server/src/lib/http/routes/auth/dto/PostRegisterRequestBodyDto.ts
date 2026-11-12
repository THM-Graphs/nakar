import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PostRegisterRequestBodyDto {
  @ApiProperty()
  @IsString()
  public username!: string;

  @ApiProperty()
  @IsString()
  public email!: string;

  @ApiProperty()
  @IsString()
  public password!: string;
}
