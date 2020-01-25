const { RESTDataSource } = require('apollo-datasource-rest');

module.exports = class ItunesApi extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://itunes.apple.com';
    const DB = require('../models');
    this.Rss = DB.rss;
  }


  async getPodcastById({ podcastId }) {
    const response = await this.get(`lookup?id=${podcastId}`);
    return response;
  }

  async search({ term }) {
    const txt = await this.get(`search?term=${term}&media=podcast&entity=podcast`);
    const response = JSON.parse(txt)
    return this.resultReducer(response.results);
  }

  async saveRss(url) {
    this.Rss.findOrCreate({ where: { url } });
  }

  resultReducer(results=[]) {
    return results.map(item => {
      this.saveRss(item.feedUrl);
      return {
        image: item.artworkUrl600,
        title: item.collectionName,
        rss: item.feedUrl
      };
    });
  }
}
