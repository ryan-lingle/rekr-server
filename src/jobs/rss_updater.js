module.exports = function() {
  const DB = require('../models');
  const RssFeed = require('../datasources/rss_feed');

  const Podcast = DB.podcast;
  const Episode = DB.episode;

  const podcasts = Podcast.findAll().then(podcasts => {
    podcasts.forEach(podcast => {
      const feed = new RssFeed(podcast.rss);
      feed.subscribe(async (podcastArgs, episodes) => {
        await Podcast.update(podcastArgs, { where: { id: podcast.id }});
        const latestEpisodeDate = await podcast.latestEpisodeDate;
        console.log(`${podcast.title} - ${latestEpisodeDate}`);
        let episode = episodes.shift();
        console.log(`${episode.title} - ${episode.released}`);
        while (episode.released > latestEpisodeDate) {
          Episode.create({
            podcastId: podcast.id, title: episode.title, content: episode.content,
            description: episode.description, released: episode.released
          });
          episode = episodes.shift();
        }
      })
    })
  });
};
