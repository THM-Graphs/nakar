import { ApiProperty } from '@nestjs/swagger';

export class UserPreviewDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ type: String, nullable: true })
  public displayName: string | null;

  public constructor(data: { id: string; displayName: string | null }) {
    this.id = data.id;
    this.displayName = data.displayName;
  }
}
