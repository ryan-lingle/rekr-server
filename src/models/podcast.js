'use strict';
const RssFeed = require('../datasources/rss_feed');
const { sendPodcastEmail } = require("../datasources/mailer");
const { withdraw } = require('../datasources/lnd');

module.exports = (sequelize, DataTypes) => {
  const podcast = sequelize.define('podcast', {
    title: DataTypes.STRING,
    rss: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    email:  {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    satoshis: {
      type: DataTypes.INTEGER,
      validate: {
        async isPositive(satoshis) {
          if ((satoshis) < 0) {
            throw new Error('Not enough funds.')
          }
        }
      }
    },
    emailVerified: DataTypes.BOOLEAN,
    token: DataTypes.STRING,
    slug: DataTypes.STRING,
    description: DataTypes.TEXT,
    image:  {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    userId: DataTypes.INTEGER,
    website:  {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    itunesId: DataTypes.INTEGER,
    guestShare: DataTypes.FLOAT
  }, {
    getterMethods: {
      latestEpisodeDate: async function() {
        const ep = await this.getEpisodes({ order: [['released', 'DESC']]})
        return ep[0] && ep[0].released;
      },

      donationSum: async function() {
        const result = await sequelize.query(`
          SELECT SUM(reks.satoshis)
          FROM reks
          INNER JOIN episodes on episodes.id = reks."episodeId"
          INNER JOIN podcasts on podcasts.id = episodes."podcastId"
          WHERE podcasts.id = ${this.id};
        `);
        return result[0][0].sum || 0;
      },

      donationCount: async function() {
        const result = await sequelize.query(`
          SELECT COUNT(*)
          FROM reks
          INNER JOIN episodes on episodes.id = reks."episodeId"
          INNER JOIN podcasts on podcasts.id = episodes."podcastId"
          WHERE podcasts.id = ${this.id};
        `);
        return result[0][0].count || 0;
      }

    },
    hooks: {
      beforeCreate: async function(podcast) {
        podcast.slug = slugify(podcast.title);
        podcast.setToken();
      },

      beforeDestroy: async function(podcast) {
        const Episode = sequelize.models.episode;
        await Episode.destroy({ where: { podcastId: podcast.id }, individualHooks: true })
      }
    }
  });

  podcast.associate = function(models) {
    podcast.hasMany(models.episode, {
      onDelete: 'cascade',
      hooks: true,
    });
    podcast.belongsTo(models.user);
  };

  podcast.prototype.sendEmail = async function() {
    sendPodcastEmail(this);
  }

  podcast.prototype.withdraw = async function(invoice) {
    const res = await withdraw(invoice, this.satoshis);
    if (res.success) {
      this.satoshis = this.satoshis - res.satoshis;
      await this.save();
    }
    return res;
  }

  podcast.prototype.setToken = async function() {
    this.token = Math.random().toString(36).substr(2);
  }

  podcast.prototype.createEpisodes = async function(episodes) {
    const Episode = sequelize.models.episode;
    episodes = await Promise.all(episodes.map(async args => {
      const [episode] = await Episode.findOrCreate({ where: {
        podcastId: this.id, title: args.title, content: args.content,
        description: args.description, released: args.released
      }});
      return episode;
    }));
    return episodes.flat();
  }

  podcast.search = async function({ term, offset }) {
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

  function slugify(title) {
    const whitelisted = "qwertyuiopasdfghjklzxcvbnm1234567890$_"
    return title.toLowerCase()
      .split(" ")
      .join("_")
      .split("").filter(s => whitelisted.includes(s))
      .join("");
  }

  return podcast;
};
