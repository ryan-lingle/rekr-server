'use strict';
module.exports = (sequelize, DataTypes) => {
  const rek = sequelize.define('rek', {
    userId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    parentId: DataTypes.INTEGER,
    satoshis: DataTypes.INTEGER,
    invoice: DataTypes.TEXT,
    invoiceId: DataTypes.TEXT,
  }, {
    hooks: {
      afterCreate: async function(rek) {
        const Rek = sequelize.models.rek;
        const RekView = sequelize.models.rek_view;

        const viewed = await RekView.findOne({
          where: {
            userId: rek.userId,
          },
          include: [{
            model: Rek,
            where: {
              episodeId: rek.episodeId,
            }
          }]
        })

        if (viewed) {
          // update parent rek
          const parentRek = await viewed.getRek();
          rek.parentId = parentRek.id;
          rek.save()

          // pay out og rekr
          const rekr = await parentRek.getUser();
          rekr.satoshis =+ Math.floor(rek.satoshis * .1);
          rekr.save();

          // pay out podcaster
          const episode = await rek.getEpisode();
          const podcast = await episode.getPodcast();
          const podcaster = await podcast.getUser();
          podcaster.satoshis =+ Math.floor(rek.satoshis * .87);
          podcaster.save();

        } else {
          const episode = await rek.getEpisode();
          const podcast = await episode.getPodcast();
          const podcaster = await podcast.getUser();
          podcaster.satoshis =+ Math.floor(rek.satoshis * .97);
          podcaster.save();
        }
      }
    }
  });
  rek.associate = function(models) {
    rek.belongsTo(models.user)
    rek.belongsTo(models.episode)
  };

  return rek;
};
