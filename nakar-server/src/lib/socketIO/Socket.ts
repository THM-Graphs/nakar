import type { Socket as SocketIoSocket } from 'socket.io';
import type { ClientToServerEvents } from './ClientToServerEvents';
import type { ServerToClientEvents } from './ServerToClientEvents';

export type Socket = SocketIoSocket<ClientToServerEvents, ServerToClientEvents>;
