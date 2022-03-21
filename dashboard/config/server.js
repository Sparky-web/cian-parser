const path = require("path")
const dotenv = require("dotenv")

dotenv.config({path: path.resolve(__dirname, "../../.env")})

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: process.env.STRAPI_PORT,
  app: {
    keys: env.array('APP_KEYS'),
  },
});
