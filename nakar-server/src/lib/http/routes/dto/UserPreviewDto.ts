import { ApiProperty } from '@nestjs/swagger';

export class UserPreviewDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public displayName: string;

  public constructor(data: { id: string; displayName: string }) {
    this.id = data.id;
    this.displayName = data.displayName;
  }
}
