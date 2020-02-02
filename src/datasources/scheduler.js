const cron = require('node-cron');

async function everyMinute(doThis) {
  cron.schedule("0 * * * * *", () =>  {
    doThis();
  });
};

async function everyFifteenMinutes(doThis) {
  cron.schedule("*/15 * * * *", () =>  {
    doThis();
  });
};


module.exports = { everyMinute, everyFifteenMinutes };
