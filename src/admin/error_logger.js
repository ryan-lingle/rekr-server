module.exports = (function () {
  return async function (body) {
    const { error } = require('../models');
    console.log(body);
    await error.create(body);
  };
})();
