import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class PostRegisterRequestBodyDto {
  @ApiProperty({ minLength: 3, maxLength: 255, pattern: '^[^\\s@]+$' })
  @IsString()
  @Length(3, 255)
  @Matches(/^[^\s@]+$/u)
  public username!: string;

  @ApiProperty({ format: 'email', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  public email!: string;

  @ApiProperty({ format: 'password', minLength: 6, maxLength: 72 })
  @IsString()
  @Length(6, 72)
  @IsByteLength(6, 72)
  public password!: string;
}
