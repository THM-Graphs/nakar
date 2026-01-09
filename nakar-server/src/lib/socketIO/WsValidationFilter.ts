import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Socket, WebSocketManager } from './WebSocketManager';

@Catch()
export class WsValidationFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const client: Socket = host.switchToWs().getClient();

    client.emit('message', WebSocketManager.createErrorNotification(exception));
  }
}
