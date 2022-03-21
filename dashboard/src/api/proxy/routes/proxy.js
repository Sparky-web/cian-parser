'use strict';

/**
 * proxy router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::proxy.proxy');
