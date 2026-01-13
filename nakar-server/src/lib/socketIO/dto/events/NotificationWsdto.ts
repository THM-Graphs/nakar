import { ApiProperty } from '@nestjs/swagger';
import { NotificationDataDto } from '../types/NotificationDataDto';

export class NotificationWsdto {
  @ApiProperty({ enum: ['NotificationWsdto'] })
  public type: 'NotificationWsdto';

  @ApiProperty({ type: NotificationDataDto })
  public notification: NotificationDataDto;

  public constructor(data: {
    type: 'NotificationWsdto';
    notification: NotificationDataDto;
  }) {
    this.type = data.type;
    this.notification = data.notification;
  }
}
