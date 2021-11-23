const Strapi = require("./parser/strapi")
const Parser = require("./parser")
const Server = require("./parser/server")
const strapi = require("strapi")
const Bx24 = require("./parser/bx24");
const axios = require("axios")

//logger
const {createLogger, format, transports} = require('winston');
const {combine, timestamp, printf, json} = format;


require("dotenv").config({path: "./.env"})

class Test {
    constructor() {
    }

    async start() {
        const loggerFormat = json(({level, message, timestamp}) => {
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

        this.bx24 = new Bx24(this)
        this.parser = new Parser(this)
        this.server = new Server(this)

        await this.server.start()
        await this.parser.start("test")

        await this.parser.parseUrl({
            "id": 2,
            "url": "https://www.cian.ru/cat.php?deal_type=rent&engine_version=2&newobject%5B0%5D=7889&offer_type=flat&room1=1&room2=1&room3=1&room4=1&room5=1&room6=1&room7=1&room9=1&type=4",
            "mode": "parse_all",
            "responsible": 1,
            "isFirstParse": false,
            "name": "Аренда ЗИЛАРТ ВСЕ",
            "isEnabled": true,
            "frequency": "every_minute",
            "shouldAddToBitrix": true,
            "created_at": "2021-09-08T18:04:54.924Z",
            "updated_at": "2021-11-03T13:09:53.759Z",
            "lastParse": {
                "id": 30,
                "items": 14,
                "addedItems": 1,
                "timeElapsed": 14,
                "time": "2021-11-03T13:09:53.716Z"
            }
        })

    }

    getThis() {
        return this
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