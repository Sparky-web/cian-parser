
const path = require("path")
const dotenv = require("dotenv")

dotenv.config({path: path.resolve(__dirname, "../../.env")})
module.exports = ({ env }) => ({
  host: env('HOST', process.env.STRAPI_HOST),
  port: env.int('PORT', process.env.STRAPI_PORT ),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '1078526cf3717630e836b6c6a8dbdeb5'),
    },
  },
});
