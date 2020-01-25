// module.exports = function() {
//   const DB = require('../models');
//   const { sequelize } = DB;
//   const RekUpdate = DB.rek_update;
//   const { everyMinute } = require('../datasources/scheduler');
//   const now = new Date();
//   everyMinute(async () => {
//     const rek_updates = await sequelize.query(`
//       SELECT * FROM rek_updates
//       WHERE "removeAt" < current_timestamp;
//     `, { model: RekUpdate });
//     rek_updates.forEach(async rek_update => {
//       const rek = await rek_update.getRek();
//       rek[`${rek_update.timePeriod}ValueGenerated`] = rek[`${rek_update.timePeriod}ValueGenerated`] - rek_update.satoshis;
//       rek.save();
//       rek_update.destroy();
//     });
//   })
// }

/*
SELECT title, sum(satoshis) FROM episodes INNER JOIN reks ON reks."episodeId" = episodes.id
INNER JOIN tags ON reks.id = tags."rekId" INNER JOIN hashtags ON tags."hashtagId" = hashtags.id
WHERE name = 'bitcoin' AND reks."createdAt" > 'now'::timestamp - '16 hour'::interval
GROUP BY episodes.title ORDER BY sum(satoshis) DESC;
*/
