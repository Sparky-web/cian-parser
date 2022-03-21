'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('status-panel')
      .service('myService')
      .getWelcomeMessage();
  },
};
