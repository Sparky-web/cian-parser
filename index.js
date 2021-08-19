const Strapi = require("./parser/strapi")
const Parser = require("./parser")
const Server = require("./parser/server")
const strapi = require("strapi")
const Bx24 = require("./parser/bx24");

//logger
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;


require("dotenv").config({ path: "./.env" })

class Index {
    constructor() {
    }
    async start() {
        const loggerFormat = json(({ level, message, timestamp }) => {
            return {level, message, timestamp}
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
            ],
        });

        this.logger.info("started")
        await strapi({dir: "./dashboard"}).start()

        this.strapi = new Strapi(this)
        this.config = await this.strapi.get("config")

        this.bx24 = new Bx24(this)
        this.parser = new Parser(this)
        this.server = new Server(this)

        await this.server.start()
        await this.parser.start()
    }

    getThis() {
        return this
    }
}

const index = new Index()
index.start()
