var express = require('express');
var router = express.Router();

var Comment = require('../models/Comment');

/* delete a comment */
router.get('/:id/remove', function(req, res, next) {
  // find the comment to delete
  Comment.findOne({ _id: req.params.id }).populate('article').exec(function(err, comment) {
    if (err) return next(err);
    // grab the article associated with the comment
    var article = comment.article;
    // remove the comment from the article's comment list
    article.comments.remove(comment);
    // save the article
    article.save(function(err) {
      if (err) return next(err);
      // delete the comment from the database
      comment.remove(function(err) {
        if (err) return next(err);
        // redirect back to the article's detail view
        res.redirect('/articles/' + article.id);
      });
    });
  });
});

module.exports = router;