const express = require('express');
const imdb = require('imdb-api');
const config = require('./config');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
// const { Client } = require('pg');

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

app.post('/authenticate', function(req, res) {
  console.log(req.body);

  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Auth failed' });
    } else if (user) {
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Auth failed' });
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

// app.get('/test', function(req, res) {
//   const query = {
//     name: 'fetch-user',
//     text: 'SELECT * FROM users'
//   };
//
//   client.query(query)
//     .then(result => res.send({data: result.rows[0]}))
//     .catch(e => res.send({meta: {error: e}, data: []}));
// });

app.listen(3000, function() {
  console.log('listening on 3000');
});
