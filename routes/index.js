var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');

var Article = require('../models/Article');
var Comment = require('../models/Comment');

/* Removes all current entries in the database (for testing only) */
router.get('/delete-db', function(req, res, next) {
  Article.collection.remove();
  Comment.collection.remove();
  res.redirect('/');
});

/* GET home page. */
router.get('/', function(req, res, next) {
  // Find all articles and sort them by date
  Article.find({}).sort([['createdAt', -1]]).exec(function(err, articles) {
    if (err) return next(err);
    // render the index page (the scraped parameter may contain the number of articles that were just scraped)
    res.render('index', { articles: articles, scraped: req.query.scraped });
  });
});

/* GET scraped articles. */
router.get('/scrape', function(req, res, next) {
  // find all the current articles
  Article.find(function(err, currentArticles) {
    if (err) return next(err);
    // request the techcrunch homepage
    request('https://techcrunch.com/', function(error, response, html) {
      // check to see if the request returned a valid response
      if (!error && response.statusCode == 200) {
        // load the html into cheerio
        var $ = cheerio.load(html);
        // start with 'a' tags that have the css class 'post-block__title__link'
        var articles = $('a.post-block__title__link').map(function(i, element) {
          // grab the headline
          var headline = $(this).text();
          // truncate the headline to 90 characters
          if (headline.length > 90) {
            headline = headline.substring(0, 87) + "...";
          }
          // grab the summary
          var summary = $(this).parent().parent().next().text();
          // truncate the summary to 140 characters
          if (summary.length > 140) {
            summary = summary.substring(0, 137) + "...";
          }
          // grab the url
          var url = $(this).attr('href');
          // find the article's image
          var imageElements = $(this).parent().parent().next().next().children().children().children();
          var image = $(imageElements).eq(0).attr('src');
          // if an image is found, change the url to request a different size
          if (image) {
            image = image.split("?")[0] + '?w=600&h=360&crop=1';
          }
          // return the article dictionary
          return {
            createdAt: new Date(),
            headline: headline,
            summary: summary,
            url: url,
            image: image
          };
        }).get();
        // filter out any articles who's title are already in the database
        articles = articles.filter(function(article) {
          for (var i = 0; i < currentArticles.length; i++) {
            if (article.headline == currentArticles[i].headline) {
              return false;
            }
          }
          return true;
        });
        var numArticles = articles.length;
        // save all the articles to the database
        Article.create(articles, function(err, articles) {
          if (err) return next(err);
          // redirect back to the homepage and pass the number of scraped articles
          res.redirect('/?scraped=' + numArticles);
        });
      } else {
        return next(error);
      }
    });
  });
});

module.exports = router;
