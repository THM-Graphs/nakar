import winston, { format } from 'winston';
import { isMainThread, threadId } from 'node:worker_threads';
import { TransformableInfo } from 'logform';

export default {
  level: 'silly',
  transports: [
    new winston.transports.Console(),
    // new winston.transports.File({
    //   filename: 'strapi.log',
    //   format: format.uncolorize(),
    // }),
  ],
  format: format.combine(
    format.colorize(),
    format.printf((info: TransformableInfo) => {
      const components: (string | null)[] = [
        new Date().toISOString(),
        `[${isMainThread ? 'main' : `thread_${threadId.toString()}`}]`,
        info['sender'] != null ? `[${info['sender']}]` : null,
        info.level,
        `${info.message}`,
        info['durationMs'] != null ? `(${info['durationMs']} ms)` : null,
      ];

      if (info.message == null) {
        console.error('No message in winston log.');
      }

      return components
        .reduce<
          string[]
        >((akku: string[], next: string | null): string[] => (next ? [...akku, next] : akku), [])
        .join(' ');
    }),
  ),
};
