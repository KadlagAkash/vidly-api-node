import winston from 'winston';
import 'winston-mongodb';
import 'dotenv/config';

const {createLogger, transports, format} = winston;
const {combine, cli, timestamp, json, metadata} = format;

const developmentLogger = () => {
  return createLogger({
    level: 'info',
    transports: [
      new transports.Console({
        format: cli(),
      }),
      new transports.MongoDB({
        format: combine(timestamp(), json(), metadata()),
        options: {useUnifiedTopology: true},
        // eslint-disable-next-line no-undef
        db: process.env.DB_URL,
        collection: 'logs_dev',
      }),
    ],
    exceptionHandlers: [
      new transports.File({
        filename: 'logs/uncaughtException.log',
        format: json(),
      }),
    ],
    rejectionHandlers: [
      new transports.File({
        filename: 'logs/unhandledRejection.log',
        format: json(),
      }),
    ],
  });
};

export default developmentLogger;
