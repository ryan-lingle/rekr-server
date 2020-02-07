'use strict';
module.exports = (sequelize, DataTypes) => {
  const error = sequelize.define('error', {
    error: DataTypes.JSON,
    client: DataTypes.BOOLEAN,
    operation: DataTypes.JSON,
    stack: DataTypes.JSON,
    location: DataTypes.STRING,
  }, {
    hooks: {
      beforeCreate: function(error, options) {
        console.log(error);
        console.log(options);
      }
    }
  });
  error.associate = function(models) {
    // associations can be defined here
  };
  return error;
};
