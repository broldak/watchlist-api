const express = require('express');
const imdb = require('imdb-api');
const config = require('./config');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Movie = require('./models/Movie');

const tempUserId = '597fa125f36d280abc429cba';
const apiKey = 'd634d874';
const timeout = 4000;

// const client = new Client();
const app = express();
mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
// client.connect();

// TODO: implement user creation
// app.post('/testCreate', function(req, res) {
//   const user = new User({
//     first_name: 'Brian',
//     last_name: 'Oldak',
//     email: 'broldak@gmail.com',
//     password: 'password',
//     movies: []
//   });
//
//   user.save().then((doc) => console.log(doc));
//
//   res.send('created\n');
// });

// TODO: use email + password not name
app.post('/authenticate', function(req, res) {
  console.log(req.body);

  User.findOne({
    email: req.body.auth.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Auth failed' });
    } else if (user) {
      if (user.password != req.body.auth.password) {
        res.status(401).json({ success: false, message: 'Auth failed' });
      } else {
        const token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1440
        });

        res.json({
          success: true,
          message: 'TOKEN',
          token
        });
      }
    }
  })
});

app.use(function(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Auth failed' });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'no token'
    });
  }
});

app.get('/movies', function(req, res) {
  imdb.search({ title: req.query.q, reqtype: 'movie' }, { apiKey }).then((val) => {
    val.id = val.imdbid;

    const { results } = val;

    results.forEach((result) => {
      const { title, year, poster } = result;

      result.id = result.imdbid;
      result.attributes = {
        title,
        year,
        poster
      };

      delete result.title;
      delete result.year;
      delete result.poster;
      delete result.imdbid;
    });

    console.log(results);

    res.send({
      data: results
    });
  }).catch((err) => {
    res.send({
      meta: {
        error: err
      },
      data: []
    });
  });
});

// Route for adding a movie to a user
app.post('/movies/add', function(req, res) {
  // TODO: figure out user based on token, for now hard coded.

  // const user = User.findOne({_id: tempUserId}, function(err, user) {
  //   if (err) return res.json({ success: false, message: 'Could not find user' });
  //
  //   console.log(user);
  //
  //   return user;
  // });

  const movie = new Movie({
    title: 'test title',
    year: '2012',
    poster: 'test poster',
    imdbid: '123'
  });

  movie.save().then((doc) => {
    User.update({_id: tempUserId}, {'$push': {
      movies: {
        watched: false,
        _movie: movie
      }
    }}, function(err, doc) {
      console.log('err ' + err);
      console.log('doc ' + doc);
    });
  });

  res.send('created');
});

app.get('/me/movies', function(req, res) {
  const user = User.findOne({_id: tempUserId})
                   .populate('movies._movie').exec(function(err, user) {
                     console.log('err ' + err);
                     console.log('movies ' + user.movies[0]._movie);

                     res.json({
                       data: user.movies
                     });
                   });
});

app.listen(3000, function() {
  console.log('listening on 3000');
});
