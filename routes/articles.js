var express = require('express');
var router = express.Router();

var Article = require('../models/Article');
var Comment = require('../models/Comment');

/* GET single article */
router.get('/:id', function(req, res, next) {
  // find the article and pre-populate the comments array (sorting by date)
  Article.findOne({ _id: req.params.id }).populate({ path: 'comments', options: { sort: { createdAt: -1 } } }).exec(function(err, article) {
    if (err) return next(err);
    res.render('article', { article: article });
  });
});

/* POST comment */
router.post('/:id/comments', function(req, res, next) {
  // find the article
  Article.findById(req.params.id, function(err, article) {
    if (err) return next(err);
    // create a new comment
    var comment = new Comment({ text: req.body.comment, article: article, createdAt: new Date() });
    // save the comment
    comment.save(function(err) {
      if (err) return next(err);
      // add the comment to the article's comment list
      article.comments.push(comment);
      // save the article
      article.save(function(err) {
        if (err) return next(err);
        // redirect back to the article's detail view
        res.redirect('/articles/' + req.params.id);
      });
    });
  });
});

module.exports = router;
