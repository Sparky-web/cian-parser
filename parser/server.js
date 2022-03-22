import express from "express"
import path from "path"
import cors from "cors"
import filesystem from "./filesystem.js"
import parser from "./parser.js"
import bx24 from "./bx24.js"
import logger from "./logger.js"
import strapi from "./strapi.js"

async function updateOne(req, res) {
    try {
        const { url, dealId } = req.query
        const data = await parser.updateOneUrl(url, dealId)
        res.send(data)
    } catch (e) {
        res.status(500)
        res.send("Error: " + e.message)
    }
}

async function createOne(req, res) {
    try {
        const { url, responsible } = req.query
        const data = await parser.parseOneUrl(url, responsible)
        res.send(data)
    } catch (e) {
        res.status(500)
        res.send("Error: " + e.message)
    }
}

const app = express()

app.use(express.json())
app.use(cors())

// app.use(express.static("../status-panel/build"))

// app.get("/", (req, res) => {
//     res.sendFile("../status-panel/build/index.html");
// });

app.get("/logs", async (req, res) => {
    logger.query({
        limit: 500,
        order: 'desc',
    }, (err, result) => {
        res.send(result.file.map(e => `${new Date(e.timestamp).toLocaleString('ru-RU', { timeZone: "Europe/Moscow" })} ${e.level} || ${e.message}`).join("<br />"))
    })
})

app.get("/error-pages/:filename", async (req, res) => {
    try {
        res.send(await filesystem.getFileContents(`.tmp/error-pages/${req.params.filename}`))
    } catch (e) {
        res.status(404).send("not found")
    }
})

app.all("/update", async (req, res) => {
    try {
        if (req.body?.model === "link" || req.body?.model === "config" || !req.body?.model) {
            // logger.info(JSON.stringify(req.body))
            logger.info("restarting because links have been modified")
            await parser.stop()
            await parser.start()
            logger.info("restarted")
        }

        res.send("")
    } catch (e) {
        console.error(e)
        res.send(e.stack || e)
    }
})

app.get("/start-manual", async (req, res) => {
    try {
        const { id } = req.query
        const [link] = await strapi.get("links", { filters: { id }, populate: "*" })

        const data = await parser.parseUrl(link)
        res.send(data)
    } catch (e) {
        res.status(500)
        res.send("Error: " + e.message)
    }
})

app.all("/update-one", updateOne)

app.all("/create-one", createOne)

app.get("/create-failed/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params

        const offers = linkId === "all" ?
            await strapi.get("offers", { filters: { inBitrix: false } }) :
            await strapi.get("offers", { filters: { parsedFromLink: linkId, inBitrix: false } })

        const created = []

        for (let offer of offers) {
            try {
                await bx24.createEntry(offer)
                created.push(offer)
            } catch (e) {
                logger.error(e)
            }
        }

        res.send({ addedItems: created.length })
    } catch (e) {
        res.status(500)
        res.send(e.stack)
    }
})

app.listen(process.env.SERVER_PORT)

export default app