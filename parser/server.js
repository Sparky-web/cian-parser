const express = require("express")
const fs = require("fs/promises")

async function start() {
    const app = express()

    app.get("/logs/:name", async (req, res) => {
        const data = await fs.readFile(`${__dirname}/logs/${req.params.name}.log`)
        console.log(data.toString())
        res.send(data?.toString())
    })

    app.listen(process.env.SERVER_PORT)

    return app
}

module.exports = {start}