const Strapi = require("./parser/strapi")
const Parser = require("./parser")
const server = require("./parser/server")
const strapi = require("strapi")

//logger
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;


require("dotenv").config({ path: "./.env" })

class Index {
    constructor() {
    }
    async start() {
        const loggerFormat = printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        });
        this.logger = createLogger({
            format: combine(
                timestamp(),
                loggerFormat
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: './parser/logs/error.log', level: 'error' }),
                new transports.File({ filename: './parser/logs/combined.log' }),            
            ]
        });

        await server.start()

        this.logger.info("started")
        await strapi({dir: "./dashboard"}).start()

        this.strapi = new Strapi(this)
        this.config = await this.strapi.get("config")
        this.parser = new Parser(this)
        await this.parser.start()
    }
}

const index = new Index()
index.start()
