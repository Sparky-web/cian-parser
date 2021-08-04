'use strict';

const { updatedDiff } = require("deep-object-diff");
const axios = require("axios")

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is created
    async beforeUpdate(params, data) {
      const [now] = await strapi.services.links.find({id: params.id});

      delete now.created_by
      delete now.updated_by
      delete now.created_at
      delete now.updated_at

      const updated = Object.keys(updatedDiff(now, data))
      if(!updated.find(key => ["lastParse", "isFirstParse"].includes(key))) {
        setTimeout(() =>  axios.post(`http://${process.env.STRAPI_HOST}:${process.env.SERVER_PORT}/update`, updated), 1000)
      }

      return data
    },
  },
};
