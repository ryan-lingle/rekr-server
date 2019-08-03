'use strict';
module.exports = (sequelize, DataTypes) => {
  const rek = sequelize.define('rek', {
    userId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    satoshis: DataTypes.INTEGER,
    invoice: DataTypes.TEXT,
    valueGenerated: DataTypes.INTEGER,
    invoiceId: DataTypes.TEXT,
  }, {
    hooks: {
      afterCreate: async function(rek) {
        const Rek = sequelize.models.rek;
        const RekView = sequelize.models.rek_view;
        const RekRelationship = sequelize.models.rek_relationships;

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
          views.forEach(async view => {
            // update parent rek
            const parentRek = await view.getRek();

            // update parent's "valueGenerated" | split value among the other views
            updateValueGenerated(parentRek, (rek.satoshis / views.length));

            await RekRelationship.create({ parentRekId: parentRek.id, childRekId: rek.id });

            parentRek.valueGenerated = parentRek.valueGenerated + rek.satoshis;
            parentRek.save();


            // pay out og rekr
            const rekr = await parentRek.getUser();
            rekr.satoshis = rekr.satoshis + Math.floor(rek.satoshis * (.1 / views.length));
            rekr.save();
          })
          // pay out podcaster
          const episode = await rek.getEpisode();
          const podcast = await episode.getPodcast();
          const podcaster = await podcast.getUser();
          podcaster.satoshis = podcaster.satoshis + Math.floor(rek.satoshis * .87);
          podcaster.save();

        } else {
          const episode = await rek.getEpisode();
          const podcast = await episode.getPodcast();
          const podcaster = await podcast.getUser();
          podcaster.satoshis = podcaster.satoshis + Math.floor(rek.satoshis * .97);
          podcaster.save();
        }
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

  rek.prototype.addTags = async function (tags) {
    const Hashtag = sequelize.models.hashtag;
    const Tag = sequelize.models.tag;
    const { id } = this;
    return await Promise.all(tags.map(async ({ name }) => {
      const res = await Hashtag.findOrCreate({ where: { name }});
      const hashtag = res[0];
      return await Tag.create({ rekId: id, hashtagId: hashtag.id });
    }));
  }

  async function updateValueGenerated(rek, satoshis) {
    rek.valueGenerated = rek.valueGenerated + satoshis;
    rek.save();

    const parents = await rek.getParents();
    parents.forEach(parent => updateValueGenerated(parent, satoshis))
  }

  return rek;
};
