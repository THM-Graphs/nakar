import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Socket } from './Socket';
import { WebSocketManager } from './WebSocketManager';

@Catch()
export class WsValidationFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const client: Socket = host.switchToWs().getClient();

    client.emit('message', {
      event: WebSocketManager.createErrorNotification(exception),
    });
  }
}
