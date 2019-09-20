const cron = require('node-cron');

// current_minute current_hour current_day_of_month current_month_plus_1 *
function oneMonthFromNow() {
  const rn = new Date();
  const seconds = rn.getSeconds();
  const minutes = rn.getMinutes();
  const hours = rn.getHours();
  const day = rn.getDate();
  const month = rn.getMonth();
  return `${seconds} ${minutes + 1} ${hours} ${day} ${month + 1} *`;
}

async function inOneMonth(doThis) {
  const task = cron.schedule(oneMonthFromNow(), () =>  {
    doThis();
    task.destroy();
  });
}

async function everyHour(doThis) {
  cron.schedule("0 * * * * *", () =>  {
    doThis();
  });
}

module.exports = { inOneMonth, everyHour };
