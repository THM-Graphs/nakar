import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class PostNoteRequestBody {
  @ApiProperty({ isArray: true, type: 'string' })
  @IsString({ each: true })
  @IsArray()
  public nodeIds!: string[];

  @ApiProperty()
  @IsString()
  public content!: string;
}
