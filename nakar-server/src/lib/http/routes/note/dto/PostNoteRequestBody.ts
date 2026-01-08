import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PostNoteRequestBody {
  @ApiProperty({ isArray: true, type: 'string' })
  @IsString({ each: true })
  public nodeIds!: string[];

  @ApiProperty()
  @IsString()
  public content!: string;
}
