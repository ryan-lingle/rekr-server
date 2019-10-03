'use strict';
const { inOneMonth } = require('../datasources/scheduler');
const Twitter = require('../datasources/twitter');

module.exports = (sequelize, DataTypes) => {
  const rek = sequelize.define('rek', {
    userId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    satoshis: {
      type: DataTypes.INTEGER,
      validate: {
        async isPositive(satoshis) {
          if ((satoshis) < 100) {
            throw new Error('A Rek must be at least 100 sats.')
          }
        }
      }
    },
    invoice: DataTypes.TEXT,
    valueGenerated: DataTypes.INTEGER,
    monthValueGenerated: DataTypes.INTEGER,
    invoiceId: DataTypes.TEXT,
    tweetRek: DataTypes.BOOLEAN
  }, {
    hooks: {
      afterCreate: async function(rek) {
        rek.increaseValueGenerated(rek.satoshis);

        const Rek = sequelize.models.rek;
        const RekView = sequelize.models.rek_view;
        const RekRelationship = sequelize.models.rek_relationships;
        const Notification = sequelize.models.notification;
        let podcasterPercent = .97;

        if (rek.tweetRek) tweetRek(rek);

        const views = await RekView.findAll({
          where: {
            userId: rek.userId,
          },
          include: [{
            model: Rek,
            where: {
              episodeId: rek.episodeId,
            }
          }]
        });

        if (views.length > 0) {
          podcasterPercent = .87;
          await Promise.all(views.map(async view => {
            // update parent rek
            const parentRek = await view.getRek();

            // build new relationships
            await RekRelationship.create({ parentRekId: parentRek.id, childRekId: rek.id });

            // pay out og rekr
            const rekr = await parentRek.getUser();
            const reward = Math.floor(rek.satoshis * (.1 / views.length));
            rekr.satoshis = rekr.satoshis + reward;
            rekr.save();

            // create notification
            Notification.create({
              notifierId: rek.userId,
              userId: rekr.id,
              rekId: parentRek.id,
              type: "rek",
              satoshis: reward
            });
          }));

          updateValueGenerated(rek);
        }
        const episode = await rek.getEpisode();
        const guests = await episode.getGuests();
        const podcast = await episode.getPodcast();

        if (guests.length > 0) {
          const guestPercent = podcasterPercent * podcast.guestShare;
          guests.forEach(guest => {
            guest.satoshis = guest.satoshis + Math.floor(rek.satoshis * (guestPercent / guests.length));
            guest.save();
          })
          podcasterPercent = podcasterPercent - guestPercent;
        }

        const podcaster = await podcast.getUser();
        podcaster.satoshis = podcaster.satoshis + Math.floor(rek.satoshis * podcasterPercent);
        podcaster.save();
      }
    }
  });
  rek.associate = function(models) {
    rek.belongsTo(models.user);
    rek.belongsTo(models.episode);
    rek.hasMany(models.rek_view);

    rek.belongsToMany(rek, {
      through: models.rek_relationships,
      as: 'children',
      foreignKey: 'parentRekId',
    });

    rek.belongsToMany(rek, {
      through: models.rek_relationships,
      as: 'parents',
      foreignKey: 'childRekId',
    });

    rek.belongsToMany(models.hashtag, {
      through: models.tag,
      as: 'hashtags',
      foreignKey: 'rekId',
    });

  };

  rek.prototype.validateTags = async function (tags) {
    if (tags.length > 3) throw new Error("You can make a Maximum of 3 Tags.")
    const Hashtag = sequelize.models.hashtag;
    const Tag = sequelize.models.tag;
    const { id } = this;
    return await Promise.all(tags.filter(onlyUnique).map(async ({ name }) => {
      return await whiteListCharacters(name);
    }));
  }

  rek.prototype.addTags = async function (tags) {
    const Hashtag = sequelize.models.hashtag;
    const Tag = sequelize.models.tag;
    const { id } = this;
    return await Promise.all(tags.filter(onlyUnique).map(async ({ name }) => {
      const res = await Hashtag.findOrCreate({ where: { name: name.toLowerCase() }});
      const hashtag = res[0];
      return await Tag.create({ rekId: id, hashtagId: hashtag.id });
    }));
  }

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  rek.prototype.tree = async function() {
    const parents = await this.getParents();
    const trees = await Promise.all(parents.map(async c => await c.tree()));
    const res = {};
    return {
      id: this.id,
      parents: trees
    }
  };

  rek.prototype.increaseValueGenerated = async function (newSats) {
    this.valueGenerated = this.valueGenerated + newSats;
    this.monthValueGenerated = this.monthValueGenerated + newSats;
    await this.save();

    // set monthValueGenerate to get deducted in 1 month
    const RekUpdate = sequelize.models.rek_update;
    await RekUpdate.create({ rekId: this.id, satoshis: newSats });
  }

  async function updateValueGenerated(rek) {
    const tree = await rek.tree();
    const coefficients = {};
    if (tree.parents.length > 0) {
      parseTree(tree, coefficients, 1 / tree.parents.length);
      allocateValue(rek.satoshis, coefficients)
    }
  }

  function allocateValue(satoshis, coefficients) {
    const Rek = sequelize.models.rek;
    Object.keys(coefficients).forEach(id => {
      Rek.findByPk(id).then(rek => {
        const val = Math.floor(satoshis * coefficients[id]);
        rek.increaseValueGenerated(val);
      })
    })
  }

  function parseTree(tree, coefficients, ratio) {
    tree.parents.forEach(childTree => {
      if (coefficients[childTree.id]) {
        coefficients[childTree.id] += ratio;
      } else {
        coefficients[childTree.id] = ratio;
      }
      if (childTree.parents.length > 0) {
        parseTree(childTree, coefficients, ratio / childTree.parents.length);
      }
    });
  }

  async function tweetRek(rek) {
    const episode = await rek.getEpisode();
    const podcast = await episode.getPodcast();
    const status = `I just donated ${rek.satoshis} Satoshis to ${episode.title} (${podcast.title}) on Rekr. ${process.env.CLIENT_DOMAIN}/episode/${episode.id}?rekId=${rek.id}&saveRek=1`;
    const twitter = new Twitter({ write: true });
    twitter.composeTweet({ status, id: rek.userId });
  }

  async function whiteListCharacters(name) {
    const whitelisted = "qwertyuiopasdfghjklzxcvbnm_-1234567890$"
    name.split('').forEach(s => {
      if (!whitelisted.includes(s.toLowerCase())) {
        throw new Error(`hashtag cannot contain ${s}`)
      }
    })
  }

  return rek;
};
