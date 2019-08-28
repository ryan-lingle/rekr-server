'use strict';
const RssFeed = require('../datasources/rss_feed');
const { sendPodcastEmail } = require("../datasources/mailer");


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
  }, {
    getterMethods: {
      latestEpisodeDate: async function() {
        const ep = await this.getEpisodes({ order: [['released', 'DESC']]})
        return ep[0] && ep[0].released;
      }
    },
    hooks: {
      beforeCreate: async function(podcast) {
        podcast.slug = slugify(podcast.title);
        podcast.token = Math.random().toString(36).substr(2);
      },

      beforeDestroy: async function(podcast) {
        const Episode = sequelize.models.episode;
        await Episode.destroy({ where: { podcastId: podcast.id }, individualHooks: true })
      },

      afterCreate: async function(podcast) {
        const Episode = sequelize.models.episode;
        const feed = new RssFeed(podcast.rss);
        feed.subscribe(async (episodes) => {
          const latestEpisodeDate = await podcast.latestEpisodeDate;
          let episode = episodes.shift();
          while (episode.released > latestEpisodeDate) {
            Episode.create({
              podcastId: podcast.id, title: episode.title,
              description: episode.description, released: episode.released
            });
            episode = episodes.shift();
          }
        })

        sendPodcastEmail(podcast);
      }
    }
  });

  podcast.associate = function(models) {
    podcast.hasMany(models.episode, {
      onDelete: 'cascade',
      hooks: true,
    });
    podcast.belongsTo(models.user)
  };

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
    return title.split(" ").join("_").toLowerCase();
  }

  return podcast;
};
