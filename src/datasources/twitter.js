const twitterAPI = require('node-twitter-api');
const Jwt = require("../auth/jwt");
class Twitter {
  constructor() {
    this.twitter = new twitterAPI({
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callback: process.env.CLIENT_DOMAIN + "/auth/twitter/callback",
      x_auth_access_type: "read"
    });
  }

  async requestToken() {
    const DB = require('../models');
    return new Promise((resolve, reject) => {
      this.twitter.getRequestToken(function(error, token, secret, results){
        if (error) {
          reject(error);
        } else {
          DB.twitter_credentials.create({ token, secret })
          resolve(token);
        }
      });
    });
  };

  // refactor this shit
  async accessToken({ requestToken, oathVerifier, id }) {
    const DB = require("../models");
    const TwitterCredentials = DB.twitter_credentials;
    const User = DB.user;
    console.log("hi");
    const { token, secret } = await TwitterCredentials.findOne({ where: { token: requestToken }});
    console.log(token, secret);
    return new Promise((resolve, reject) => {
      this.twitter.getAccessToken(token, secret, oathVerifier, async (error, accessToken, accessTokenSecret, results) => {
        if (error) {
          console.log("1:");
          console.log(error);
          reject(error);
        } else {
          this.twitter.verifyCredentials(accessToken, accessTokenSecret, {}, async (error, data, response) => {
            if (error) {
              console.log("2:");
              console.log(error);
              reject(error);
            } else {
              try {
                console.log(data);
                const { id_str, screen_name, profile_image_url_https } = data;
                let user = await User.findOne({ where: { twitterId: id_str }});
                if (!user) {
                  user = await this.createUser({
                    twitterId: id_str,
                    twitterKey: accessToken,
                    twitterSecret: accessTokenSecret,
                    username: screen_name,
                    profilePic: profile_image_url_https.replace("_normal", ""),
                    emailVerified: true
                  });
                };
                const token = Jwt.sign(user.id.toString());
                const hasPodcast = await user.hasPodcast;
                console.log(user);
                resolve({
                  id: user.id,
                  signIn: true, token,
                  profilePic: user.profilePic,
                  username: user.username,
                  hasPodcast
                });
              } catch(error) {
                console.log("3:");
                console.log(error);
                reject(error);
              }
            }
          });
        }
      })
    });
  };

  async createUser(options, n=0) {
    const DB = require("../models");
    const User = DB.user;
    try {
      if (n) options.username = options.username + n;
      return await User.create(options);
    } catch(e) {
      if (e.errors[0].message === "username is taken") {
        if (n) options.username = options.username.substring(0, options.username.length - 1);
        return await this.createUser(options, n + 1);
      } else {
        throw(e);
      }
    }
  }

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

module.exports = Twitter;
