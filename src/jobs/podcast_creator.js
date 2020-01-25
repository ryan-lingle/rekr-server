
(async function() {
  const DB = require('../models');
  const RssFeed = require('../datasources/rss_feed');
  const Rss = DB.rss;
  const Podcast = DB.podcast;
  const { everyMinute } = require('../datasources/scheduler');
  const rsses = await Rss.findAll();
  rsses.map(async rss => {
    const feed = new RssFeed(rss.url);
    const [podcastArgs, episodes] = await feed.toPodcast();
    const [podcast] = await Podcast.findOrCreate({ where: podcastArgs });
    podcast.createEpisodes(episodes);
    rss.destroy();
  })
})();
