var createError = require('http-errors');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var logger = require('morgan');

// setup express-handlebars
var exphbs  = require('express-handlebars');
var hbs = exphbs({
  defaultLayout: "main",
  helpers: {
    // a block helper that provides more extensive comparative statements
    compare: function(lvalue, operator, rvalue, options) {
      var operators, result;

      if (arguments.length < 3) {
        throw new Error('Handlebars helper \'compare\' needs 2 arguments.');
      }

      if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = '===';
      }

      operators = {
        '==': function(l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; }
      }

      if (!operators[operator]) {
        throw new Error("Handlebars helper 'compare' does not recognize the operator '" + operator + "'");
      }

      result = operators[operator](lvalue, rvalue);

      if (result) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    dateFormat: require('handlebars-dateformat')
  }
});

// setup database
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/news-scraper')
  .then(() => console.log('connection successful'))
  .catch((err) => console.error(err));

// load all the routers
var indexRouter = require('./routes/index');
var articleRouter = require('./routes/articles');
var commentRouter = require('./routes/comments');

var app = express();

// view engine setup
app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

// force https connection
var https_redirect = function(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] != 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    } else {
      return next();
    }
  } else {
    return next();
  }
};

app.use(https_redirect);

// setup all the routers
app.use('/', indexRouter);
app.use('/articles', articleRouter);
app.use('/comments', commentRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
