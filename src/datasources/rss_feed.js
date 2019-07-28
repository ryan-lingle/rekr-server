const Parser = require('rss-parser');

module.exports = class RssFeed {
  constructor(rssUrl) {
    this.url = rssUrl;
    this.rssParser = new Parser();
  }

  async toPodcast() {
    const feed = await this.rssParser.parseURL(this.url);
    const podcast = this.podcastReducer(feed);
    return this.verify(podcast);
  }

  podcastReducer(feed) {
    return {
      title: feed.title,
      rss: this.url,
      description: feed.description,
      email: feed.itunes.owner.email,
      image: feed.itunes.image,
      website: feed.link,
      episodes: this.episodeReducer(feed.items),
    }
  }

  episodeReducer(episodes) {
    return episodes.map(e => {
      return {
        title: e.title,
        description: e.content,
        released: e.isoDate,
      }
    })
  }

  verify(podcast) {
    Object.keys(podcast).forEach(key => {
      if (key != "episodes" && typeof podcast[key] != "string") {
        podcast[key] = null;
      }
    })
    return podcast;
  }
}
