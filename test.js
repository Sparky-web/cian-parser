const Strapi = require("./parser/strapi")
const Parser = require("./parser")
const Server = require("./parser/server")
const strapi = require("strapi")
const Bx24 = require("./parser/bx24");
const axios = require("axios")

//logger
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;


require("dotenv").config({ path: "./.env" })

class Test {
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
            ],
        });

        this.logger.info("Test started")
        await strapi({dir: "./dashboard"}).start()

        this.strapi = new Strapi(this)
        this.config = await this.strapi.get("config")

        this.parser = new Parser(this)
        this.server = new Server(this)
        this.bx24 = new Bx24(this)

        await this.server.start()

        const offer = (await this.strapi.get("offers"))[0]
        const x = await this.bx24.createEntry(offer)

        // await this.parser.start()
    }
}

const index = new Test()
index.start()

// async function start() {
//     const {data} = await axios.get("https://cdn-p.cian.site/images/47/621/111/kvartira-moskva-golovinskoe-shosse-1111267487-4.jpg")
//     console.log(Buffer.from(data).toString('base64'))
//
// }
//
// start()