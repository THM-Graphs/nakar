import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProjectRequestBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public title!: string;
}
