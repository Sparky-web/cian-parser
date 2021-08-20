const express = require("express")
const fs = require("fs/promises")
const path = require("path")
const cors = require("cors")
const methodOverride = require('method-override')

class Server {
    constructor(parent) {
        this.parser = parent.parser
        this.logger = parent.logger
        this.strapi = parent.strapi
        this.bx24 = parent.bx24
    }

    async updateOne(req, res) {
        try {
            const {url, dealId} = req.query
            const data = await this.parser.updateOneUrl(url, dealId)
            res.send(data)
        } catch (e) {
            res.status(500)
            res.send("Error: " + e.message)
        }
    }

    async createOne(req, res) {
        try {
            const {url, responsible} = req.query
            const data = await this.parser.parseOneUrl(url, responsible)
            res.send(data)
        } catch (e) {
            res.status(500)
            res.send("Error: " + e.message)
        }
    }

    async start() {
        const app = express()
        const that = this;


        app.use(express.json())
        app.use(cors())
        app.use(express.static(path.join(__dirname, "../status-panel/build")))

        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "../status-panel/build", "index.html"));
        });
        app.get("/logs/:name", async (req, res) => {
            that.logger.query({
                limit: 500,
                order: 'desc',
            }, (err, result) => {
                res.send(result.file.map(e => `${e.level} ${e.timestamp} || ${e.message}`).join("<br />"))
            })
        })

        app.post("/update", async (req, res) => {
            if (req.body?.model === "links" || !req.body?.model) {
                that.logger.info(JSON.stringify(req.body))
                that.logger.info("restarting because links have been modified")
                await that.parser.stop()
                await that.parser.start()
                that.logger.info("restarted")
            }

            res.send()
        })
        app.get("/start-manual", async (req, res) => {
            try {
                const {id} = req.query
                const [link] = await this.strapi.get("links", {id})

                const data = await this.parser.parseUrl(link)
                res.send(data)
            } catch (e) {
                res.status(500)
                res.send("Error: " + e.message)
            }
        })

        app.get("/update-one", this.updateOne.bind(this))
        app.post("/update-one", this.updateOne.bind(this))

        app.get("/create-one", this.createOne.bind(this))
        app.post("/create-one", this.createOne.bind(this))

        app.get("/create-failed/:linkId", async (req, res) => {
            try {
                const {linkId} = req.params

                const offers = linkId === "all" ?
                    await this.strapi.getOffers({inBitrix: false}) :
                    await this.strapi.getOffers({parsedFromLink: linkId, inBitrix: false})

                const created = []

                for (let offer of offers) {
                    try {
                        await this.bx24.createEntry(offer)
                        created.push(offer)
                    } catch (e) {
                        this.logger.error(e)
                    }
                }

                res.send({addedItems: created.length})
            } catch (e) {
                res.status(500)
                res.send(e.stack)
            }
        })

        app.listen(process.env.SERVER_PORT)

        this.app = app
        return app
    }
}


module.exports = Server
