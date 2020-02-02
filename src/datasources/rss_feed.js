const Parser = require('rss-parser');
const { everyFifteenMinutes } = require('./scheduler');

module.exports = class RssFeed {
  constructor(rssUrl) {
    this.url = rssUrl;
    this.rssParser = new Parser();
  }

  async toPodcast() {
    const feed = await this.rssParser.parseURL(this.url);
    const [podcast, episodes] = this.podcastReducer(feed);
    return [this.verify(podcast), episodes];
  }

  async subscribe(callback) {
    const comp = this;
    everyFifteenMinutes(async () => {
      const [podcast, episodes] = await comp.toPodcast();
      callback(podcast, episodes);
    })
  }

  podcastReducer(feed) {
    return [{
      title: feed.title,
      rss: this.url,
      description: feed.description,
      email: feed.itunes.owner.email,
      image: feed.itunes.image,
      website: feed.link,
    }, this.episodeReducer(feed.items)];
  }

  episodeReducer(episodes) {
    return episodes.map(e => {
      return {
        title: e.title,
        description: e.content,
        released: new Date(e.isoDate),
        content: e.enclosure.url
      }
    })
  }

  verify(podcast) {
    Object.keys(podcast).forEach(key => {
      if (typeof podcast[key] != "string") {
        podcast[key] = null;
      }
    })
    return podcast;
  }
}
