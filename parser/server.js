const express = require("express")
const fs = require("fs/promises")

class Server {
    constructor(parent) {
        this.parser = parent.parser
        this.logger = parent.logger
    }

    async start() {
        const app = express()
        const that = this;

        app.use(express.json())
        app.get("/logs/:name", async (req, res) => {
            // const data = await fs.readFile(`${__dirname}/logs/${req.params.name}.log`)
            // res.send(data?.toString()?.replace(/\\n/ig, "<br />"))

            that.logger.query({
                limit: 100,
                order: 'desc',
            }, (err, result) => {
                res.send(result.file.map(e => `${e.level} ${e.timestamp} || ${e.message}`).join("<br />"))
            })
        })

        app.post("/update", async (req, res) => {
            if(req.body?.model === "links") {
                that.logger.info(JSON.stringify(req.body))
                that.logger.info("restarting because links had been modified")
                await that.parser.stop()
                await that.parser.start()
                that.logger.info("restarted")
            }
            res.send()
        })

        app.listen(process.env.SERVER_PORT)

        this.app = app
        return app
    }


}


module.exports = Server