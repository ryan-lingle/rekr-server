'use strict';
module.exports = (sequelize, DataTypes) => {
  const guest_tag = sequelize.define('guest_tag', {
    episodeId: DataTypes.INTEGER,
    userId: {
      type: DataTypes.INTEGER,
      validate: {
        async isUnique(val) {
          const { episodeId, userId } = this;

          const exists = await guest_tag.findOne({ where: { episodeId, userId } })

          if (exists) {
            throw new Error('Already tagged this Guest')
          }
        }
      }
    }
  }, {});
  guest_tag.associate = function(models) {
    // associations can be defined here
  };
  return guest_tag;
};
