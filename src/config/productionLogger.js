import winston from 'winston';
import 'dotenv/config';

const {createLogger, transports, format} = winston;
const {combine, timestamp, json, metadata} = format;

const productionLogger = () => {
  return createLogger({
    level: 'info',
    format: combine(timestamp(), json(), metadata()),
    transports: [
      new transports.File({filename: 'logs/app-error.log', level: 'error'}),
      new transports.File({filename: 'logs/combined.log'}),
      new transports.MongoDB({
        level: 'error',
        options: {useUnifiedTopology: true},
        // eslint-disable-next-line no-undef
        db: process.env.DB_URL,
        collection: 'logs_prod',
      }),
    ],
    exceptionHandlers: [
      new transports.File({
        filename: 'logs/logfiles/uncaughtException.log',
        format: json(),
      }),
    ],
    rejectionHandlers: [
      new transports.File({
        filename: 'logs/logfiles/unhandledRejection.log',
        format: json(),
      }),
    ],
  });
};

export default productionLogger;
