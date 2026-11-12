import { ApiProperty } from '@nestjs/swagger';

export class PostNoteResponseBodyDto {
  @ApiProperty()
  public id: string;

  public constructor(data: { id: string }) {
    this.id = data.id;
  }
}
