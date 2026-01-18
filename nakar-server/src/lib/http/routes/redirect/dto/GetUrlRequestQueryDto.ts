import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetUrlRequestQueryDto {
  @ApiProperty()
  @IsString()
  public url!: string;
}
