'use strict';

/**
 *  proxy controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::proxy.proxy');
