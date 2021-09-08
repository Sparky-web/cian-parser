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

        this.bx24 = new Bx24(this)
        this.parser = new Parser(this)
        this.server = new Server(this)

        await this.server.start()
        await this.parser.start("test")

        const x = await this.bx24.getFields({
            "id": 564,
            "title": "2-комн. кв., 60 м², 5/21 этаж",
            "description": "СВЕЖИЙ РЕМОНТ. Сдается СВЕТЛАЯ УЮТНАЯ 2-комнатная квартира европейской планировки.  ИДЕАЛЬНЫЙ вариант для одного человека, семейной пары. Полностью меблированная, выполнен качественный дизайнерский ремонт. Сделана ШУМОИЗОЛЯЦИЯ.  В наличии вся необходимая бытовая техника, включая посудомоечную машину. Изолированная спальня.  Имеется гардеробная комната. Санузел с ванной, душевой кабиной и биде. Территория ЖК огорожена и находится под охраной, паркинг на территории. 3 квартиры на площадке. Развитая инфраструктура. Удобное расположение дома. Рядом ТТК. 5 минут и ты в центре. Недалеко шикарный парк и Москва река",
            "address": "Москва, ЗАО, Филевский парк, Фили, Береговой, 5к3",
            "link": "https://www.cian.ru/rent/flat/263217098/",
            "uId": 263217098,
            "jk": "ЖК «Фили Град»",
            "jkLink": "https://www.cian.ru/zhiloy-kompleks-fili-grad-moskva-5489/",
            "inBitrix": false,
            "price": 90000,
            "floorNumber": 5,
            "parsedFromLink": {
                "id": 15,
                "url": "https://www.cian.ru/cat.php?deal_type=rent&engine_version=2&is_by_homeowner=1&newobject%5B0%5D=5489&offer_type=flat&room1=1&room2=1&room3=1&room4=1&room5=1&room6=1&type=4",
                "mode": "parse_all",
                "responsible": 9,
                "isFirstParse": true,
                "name": "ЖК Фили Град Аренда $собственник",
                "isEnabled": true,
                "frequency": "every_10_hours",
                "shouldAddToBitrix": true,
                "created_at": "2021-08-10T14:57:28.240Z",
                "updated_at": "2021-09-08T17:00:05.487Z",
                "lastParse": {
                    "id": 159,
                    "items": 1,
                    "addedItems": 0,
                    "timeElapsed": 5,
                    "time": "2021-09-08T17:00:05.453Z"
                }
            },
            "area": 60,
            "dealType": "rent",
            "images": "https://cdn-p.cian.site/images/62/083/411/kvartira-moskva-beregovoy-proezd-1143802641-1.jpg,https://cdn-p.cian.site/images/33/083/411/kvartira-moskva-beregovoy-proezd-1143803327-1.jpg,https://cdn-p.cian.site/images/62/083/411/kvartira-moskva-beregovoy-proezd-1143802670-1.jpg,https://cdn-p.cian.site/images/62/083/411/kvartira-moskva-beregovoy-proezd-1143802666-1.jpg,https://cdn-p.cian.site/images/62/083/411/kvartira-moskva-beregovoy-proezd-1143802665-1.jpg",
            "created_at": "2021-09-07T16:17:26.507Z",
            "updated_at": "2021-09-07T16:17:26.528Z",
            "contacts": [
                {
                    "id": 542,
                    "number": "79639902075",
                    "name": "ID 72044436"
                }
            ]
        })
        console.log(x)
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