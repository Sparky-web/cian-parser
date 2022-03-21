'use strict';

/**
 * proxy service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::proxy.proxy');
