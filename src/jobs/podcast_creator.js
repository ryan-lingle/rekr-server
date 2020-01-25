
module.exports = function() {
  const DB = require('../models');
  const RssFeed = require('../datasources/rss_feed');
  const Rss = DB.rss;
  const Podcast = DB.podcast;
  const { everyMinute } = require('../datasources/scheduler');
  everyMinute(async () => {
    const rsses = await Rss.findAll({ limit: 15 });
    rsses.map(async rss => {
      const feed = new RssFeed(rss.url);
      const [podcastArgs, episodes] = await feed.toPodcast();
      const [podcast] = await Podcast.findOrCreate({ where: podcastArgs });
      podcast.createEpisodes(episodes);
      rss.destroy();
    })
  })
}
