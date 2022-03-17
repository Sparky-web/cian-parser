import strapi from "./strapi.js";

export default await strapi.get("config")