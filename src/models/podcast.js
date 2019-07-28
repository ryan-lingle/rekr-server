'use strict';
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
    hooks: {
      beforeCreate: async function(podcast) {
        podcast.slug = slugify(podcast.title);
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
    podcast.belongsTo(models.user)
  };

  function slugify(title) {
    return title.split(" ").join("_").toLowerCase();
  }

  return podcast;
};
