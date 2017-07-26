const express = require('express');
const imdb = require('imdb-api');
const apiKey = 'd634d874';
const timeout = 10000;

const app = express();

app.get('/movies', function(req, res) {
  imdb.search({ title: 'Green'}, { apiKey }).then((val) => {
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

app.listen(3000, function() {
  console.log('listening on 3000');
});
