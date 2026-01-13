import { ApiProperty } from '@nestjs/swagger';

export class NotificationDataDto {
  @ApiProperty()
  public message: string;

  @ApiProperty({ enum: ['error', 'message', 'warning'] })
  public severity: 'error' | 'message' | 'warning';

  @ApiProperty()
  public date: string;

  public constructor(data: {
    message: string;
    severity: 'error' | 'message' | 'warning';
    date: string;
  }) {
    this.message = data.message;
    this.severity = data.severity;
    this.date = data.date;
  }
}
