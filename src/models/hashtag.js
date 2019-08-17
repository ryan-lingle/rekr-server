'use strict';
module.exports = (sequelize, DataTypes) => {
  const hashtag = sequelize.define('hashtag', {
    name: DataTypes.STRING
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

  hashtag.prototype.getFeed = async function({ offset }) {
    const stream = await this.getReks({ limit: 10, offset, order: [['valueGenerated', 'DESC']] })
    const more = stream.length == 10;
    return { stream, more }
  }

  return hashtag;
};
