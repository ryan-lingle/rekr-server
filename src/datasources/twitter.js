const twitterAPI = require('node-twitter-api');
const Jwt = require("../auth/jwt");
const DB = require('../models');
const TwitterCredentials = DB.twitter_credentials;
const User = DB.user;

module.exports = class Twitter {
  constructor() {
    this.twitter = new twitterAPI({
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callback: process.env.TWITTER_CALLBACK
    });
  }

  async requestToken() {
    return new Promise((resolve, reject) => {
      this.twitter.getRequestToken(function(error, token, secret, results){
        if (error) {
          reject(error);
        } else {
          TwitterCredentials.create({ token, secret })
          resolve(token);
        }
      });
    });
  }

  async accessToken({ requestToken, oathVerifier }) {
    const { token, secret } = await TwitterCredentials.findOne({ where: { token: requestToken }});
    return new Promise((resolve, reject) => {
      this.twitter.getAccessToken(token, secret, oathVerifier, (error, accessToken, accessTokenSecret, results) => {
        if (error) {
          reject(error);
        } else {
          this.twitter.verifyCredentials(accessToken, accessTokenSecret, {}, async function(error, data, response) {
            if (error) {
              console.log(error);
            } else {
              const { id_str, screen_name, profile_image_url } = data;
              let user = await User.findOne({ where: { twitterId: id_str }});
              if (user) {
                user.username = screen_name;
                user.profilePic = profile_image_url;
                await user.save();
              } else {
                user = await User.create({
                  twitterId: id_str,
                  username: screen_name,
                  profilePic: profile_image_url,
                  emailVerified: true
                });
              }
              const token = Jwt.sign(user.id.toString());
              resolve({ id: user.id, token, profilePic: user.profilePic, username: user.username })
            }
          });
        }
      });
    })
  }
}
