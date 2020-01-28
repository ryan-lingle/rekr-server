(async function() {
  const db = require('./models');
  const RssFeed = require('./datasources/rss_feed');

  const Podcast = db.podcast;
  const Episode = db.episode;

  const podcasts = await Podcast.findAll();
  podcasts.forEach(async ({ rss }) => {
    const feed = new RssFeed(rss);
    const [podcastArgs, episodeArgs] = await feed.toPodcast();
    episodeArgs.forEach(async ({ title, content }) => {
      await Episode.update({content},{ where: {title}});
    })
  });

})()
