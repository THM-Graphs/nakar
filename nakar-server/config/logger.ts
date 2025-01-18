import winston from 'winston';

export default {
  transports: [
    new winston.transports.Console({
      level: 'silly',
    }),
  ],
};
