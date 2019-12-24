const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

const ts = {
  day: yesterday.toLocaleDateString(),
  month: lastMonth.toLocaleDateString(),
  alltime: "1/1/2019"
}



async function adminData({ query }) {
  const { t } = query;
  const date = ts[t];
  const DB = require('../models');
  const Sequelize = DB.sequelize;
  const fees = await Sequelize.query(`SELECT sum(fee) FROM reks WHERE "createdAt" > '${date}';`);
  const users = await Sequelize.query(`SELECT count(*), sum(satoshis) FROM users WHERE "createdAt" > '${date}';`);
  const reks = await Sequelize.query(`SELECT count(*), sum(satoshis) FROM reks WHERE "createdAt" > '${date}';`);
  const podcasts = await Sequelize.query(`SELECT count(*), sum(satoshis) FROM podcasts WHERE "createdAt" > '${date}';`);
  const claimedPodcasts = await Sequelize.query(`SELECT count(*) FROM podcasts WHERE podcasts."emailVerified"= true AND "createdAt" > '${date}';`);

  return {
    fees: fees[0][0].sum,
    users: users[0][0].count,
    reks: reks[0][0],
    deposited: parseInt(users[0][0].sum) + parseInt(podcasts[0][0].sum),
    podcasts: {
      count: podcasts[0][0].count,
      claimed: claimedPodcasts[0][0].count
    }
  };
}

module.exports = { adminData };
