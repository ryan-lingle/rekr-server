'use strict';
const { inOneMonth } = require('../datasources/scheduler');
module.exports = (sequelize, DataTypes) => {
  const rek = sequelize.define('rek', {
    userId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    satoshis: DataTypes.INTEGER,
    invoice: DataTypes.TEXT,
    valueGenerated: DataTypes.INTEGER,
    monthValueGenerated: DataTypes.INTEGER,
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
          await Promise.all(views.map(async view => {
            // update parent rek
            const parentRek = await view.getRek();

            // build new relationships
            await RekRelationship.create({ parentRekId: parentRek.id, childRekId: rek.id });

            // pay out og rekr
            const rekr = await parentRek.getUser();
            rekr.satoshis = rekr.satoshis + Math.floor(rek.satoshis * (.1 / views.length));
            rekr.save();
          }));

          updateValueGenerated(rek);


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
    return await Promise.all(tags.filter(onlyUnique).map(async ({ name }) => {
      const res = await Hashtag.findOrCreate({ where: { name }});
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
        rek.valueGenerated = rek.valueGenerated + val;
        rek.monthValueGenerated = rek.monthValueGenerated + val;

        rek.save();
        inOneMonth(() => {
          rek.monthValueGenerated = rek.monthValueGenerated - val;
          rek.save();
        })
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

  return rek;
};
