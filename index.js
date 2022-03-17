import "./parser/init.js"
import parser from "./parser/index.js"
import strapi from "./parser/strapi.js"
import "./parser/server.js"
// await strapi({dir: "./dashboard"}).start()

await parser.start()
// await parser.parseUrl((await strapi.get("links"))[0]).catch(e => console.log(e.message))