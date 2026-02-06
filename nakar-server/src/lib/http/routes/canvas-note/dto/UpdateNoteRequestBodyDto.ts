import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateNoteRequestBodyDto {
  @ApiProperty()
  @IsString()
  public content!: string;
}
