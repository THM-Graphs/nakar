import type { Server as SocketIoServer } from 'socket.io';
import type { ClientToServerEvents } from './ClientToServerEvents';
import type { ServerToClientEvents } from './ServerToClientEvents';

export type Server = SocketIoServer<ClientToServerEvents, ServerToClientEvents>;
