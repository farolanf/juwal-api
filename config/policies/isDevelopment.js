'use strict';

/**
 * `isDevelopment` policy.
 */

module.exports = async (ctx, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return await next();
  }
  ctx.unauthorized()
};
