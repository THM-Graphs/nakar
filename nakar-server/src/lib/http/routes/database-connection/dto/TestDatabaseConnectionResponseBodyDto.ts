import { ApiProperty } from '@nestjs/swagger';

export class TestDatabaseConnectionResponseBodyDto {
  @ApiProperty()
  public success: boolean;

  @ApiProperty()
  public message: string;

  public constructor(data: { success: boolean; message: string }) {
    this.success = data.success;
    this.message = data.message;
  }
}
