const twitterAPI = require('node-twitter-api');
const Jwt = require("../auth/jwt");
const DB = require('../models');
const TwitterCredentials = DB.twitter_credentials;
const User = DB.user;

class Twitter {
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
  };

  // refactor this shit
  async accessToken({ requestToken, oathVerifier, id }) {
    const { token, secret } = await TwitterCredentials.findOne({ where: { token: requestToken }});
    return new Promise((resolve, reject) => {
      this.twitter.getAccessToken(token, secret, oathVerifier, (error, accessToken, accessTokenSecret, results) => {
        if (error) {
          reject(error);
        } else {
          this.twitter.verifyCredentials(accessToken, accessTokenSecret, {}, async function(error, data, response) {
            if (error) {
              reject(error);
            } else {
              const { id_str, screen_name, profile_image_url } = data;
              let user;
              if (id != "null") {
                user = await User.findByPk(id);
                user.twitterId = id_str;
                user.twitterKey = accessToken;
                user.twitterSecret = accessTokenSecret;
                user.canTweet = true;
                await user.save();
                resolve({ id: user.id, signIn: false })
              } else {
                user = await User.findOne({ where: { twitterId: id_str }});
                if (user) {
                  user.username = screen_name;
                  user.profilePic = profile_image_url;
                  await user.save();
                } else {
                  user = await User.create({
                    twitterId: id_str,
                    twitterKey: accessToken,
                    twitterSecret: accessTokenSecret,
                    username: screen_name,
                    profilePic: profile_image_url,
                    canTweet: true,
                    emailVerified: true
                  });
                }
                const token = Jwt.sign(user.id.toString());
                const hasPodcast = await user.hasPodcast;
                resolve({
                  id: user.id,
                  signIn: true, token,
                  profilePic: user.profilePic,
                  username: user.username,
                  hasPodcast
                });
              }
            }
          });
        }
      })
    });
  };

  async composeTweet({ status, id }) {
    const DB = require('../models');
    const user = await DB.user.findByPk(id);
    this.twitter.statuses("update", {
       status
      },
      user.twitterKey,
      user.twitterSecret,
      function(error, data, response) {
        if (error) {
          console.log(error);
        } else {
          console.log(data);
        }
      }
    );
  }
};

module.exports = new Twitter();
