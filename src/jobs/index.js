module.exports = (function() {
  const rssUpdater = require('./rss_updater');
  return function() {
    console.log("starting recurring jobs...")
    rssUpdater();
  }
})();
