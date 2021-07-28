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
            const data = await fs.readFile(`${__dirname}/logs/${req.params.name}.log`)
            res.send(data?.toString())
        })

        app.post("/update", async (req, res) => {
            if(req.body?.model === "links") {
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