import winston from 'winston'
const { createLogger, format, transports } = winston
const { combine, timestamp, json } = format;
import strapi from "./strapi.js"
import Transport from "winston-transport"

const loggerFormat = json(({ level, message, timestamp }) => {
    return { level, message, timestamp }
});

class Log2Strapi extends Transport {
    constructor(opts) {
        super(opts);
    }

    async log(info, callback) {
        const data = {
            log: info.message?.log || info.message,
            level: info.level,
            proxy: info.proxy,
            link: info.link
        }
        await strapi.create("logs", data)
        callback();
    }
};

export default createLogger({
    format: combine(
        timestamp(),
        loggerFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: './parser/logs/error.log', level: 'error' }),
        new transports.File({ filename: './parser/logs/combined.log' }),
        new Log2Strapi()
    ],
});