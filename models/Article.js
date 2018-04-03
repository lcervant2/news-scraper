var mongoose = require('mongoose');

var ArticleSchema = new mongoose.Schema({
  createdAt: Date,
  headline: String,
  summary: String,
  url: String,
  image: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  commentCount: Number
});

// use a prevalidation callback to update the comment count
ArticleSchema.pre('validate', function(next) {
  this.commentCount = this.comments.length;
  next();
});

module.exports = mongoose.model('Article', ArticleSchema);