'use strict';
module.exports = (sequelize, DataTypes) => {
  const hashtag = sequelize.define('hashtag', {
    name: {
      type: DataTypes.STRING,
      validate: {
        async whiteListCharacter(name) {
          const whitelisted = "qwertyuiopasdfghjklzxcvbnm_-1234567890$"
          name.split('').forEach(s => {
            if (!whitelisted.includes(s.toLowerCase())) {
              throw new Error(`hashtag cannot contain ${s}`)
            }
          })
        }
      }
    }
  }, {
    getterMethods: {
      followers: async function() {
        const HashtagFollow = sequelize.models.hashtag_follow;
        return await HashtagFollow.count({ where: { hashtagId: this.id }});
      }
    },
  });
  hashtag.associate = function(models) {
    hashtag.belongsToMany(models.rek, {
      through: models.tag,
      as: 'reks',
      foreignKey: 'hashtagId',
    });

    hashtag.belongsToMany(models.user, {
      through: models.hashtag_follow,
      as: 'followers',
      foreignKey: 'hashtagId',
    });
  };

  hashtag.search = async function({ term, offset }) {
    const split = term.split(' ');
    if (split.length > 1) {
      return await sequelize.query(`
        SELECT *
        FROM ${this.tableName}
        WHERE _search @@ plainto_tsquery('english', :term)
        LIMIT 10
        OFFSET :offset;
      `, {
        model: this,
        replacements: { term, offset },
      });
    } else {
      return await sequelize.query(`
        SELECT *
        FROM ${this.tableName}
        WHERE _search @@ to_tsquery('english', :term)
        LIMIT 10
        OFFSET :offset;
      `, {
        model: this,
        replacements: { term: term + ":*", offset },
      });
    };
  }

  hashtag.prototype.getFeed = async function({ timePeriod, offset }) {
    const tpDict = {
      week: "1 week",
      month: "1 month",
      "all-time": "100 years",
    }

    const [result] = await sequelize.query(`
      SELECT sum(satoshis) as satoshis, hashtags.id as "hashtagId", episodes.id as "episodeId" FROM episodes INNER JOIN reks ON reks."episodeId" = episodes.id
      INNER JOIN tags ON reks.id = tags."rekId" INNER JOIN hashtags ON tags."hashtagId" = hashtags.id
      WHERE hashtags.id = ${this.id} AND reks."createdAt" > 'now'::timestamp - '${tpDict[timePeriod]}'::interval
      GROUP BY episodes.id, hashtags.id ORDER BY sum(satoshis) DESC
      OFFSET ${offset}
      LIMIT 10;
    `);
    const stream = result.map(item => {
      item.timePeriod = timePeriod;
      return item;
    });
    console.log(stream);
    const len = stream.length;
    const more = len == 10;
    return { stream, more }
  }

  return hashtag;
};

/*
SELECT title, sum(satoshis) FROM episodes INNER JOIN reks ON reks."episodeId" = episodes.id
INNER JOIN tags ON reks.id = tags."rekId" INNER JOIN hashtags ON tags."hashtagId" = hashtags.id
WHERE name = 'bitcoin' AND reks."createdAt" > 'now'::timestamp - '16 hour'::interval
GROUP BY episodes.title ORDER BY sum(satoshis) DESC;
*/
