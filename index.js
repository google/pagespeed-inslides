'use strict';

const express = require('express');
const compression = require('compression');
const i18next = require('i18next');
const middleware = require('i18next-express-middleware');
const path = require('path');
const app = express();
app.use(compression());

const routes = require('./routes.js');
const slides = require('./slides.js');

slides.prepare()
.then(() => {
  // Initialize i18n
  const i18nextOptions = {
    fallbackLng: 'en',
    resources: require('./translations.json'),
    detection: {
      order: ['querystring'],
      lookupQuerystring: 'locale'
    }
  };
  i18next
    .use(middleware.LanguageDetector)
    .init(i18nextOptions);
  app.use(middleware.handle(i18next));

  // Globally enable CORS
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Setup view engine
  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'views'));

  // Setup static routes
  app.use('/pagespeed/', express.static(path.join(__dirname, 'public')));

  // Setup dynamic routes
  app.get('/pagespeed/raw', routes.getPageSpeedRaw);
  app.get('/pagespeed/processed', routes.getPageSpeedProcessed);
  app.get('/pagespeed/report', routes.getPageSpeedReport);
  app.get('/pagespeed/slides', routes.getPageSpeedSlides);

  // Start server
  const server = app.listen(process.env.PORT || 3000, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.log('PageSpeed InSlides™ running at http://%s:%s', host, port);
  });
})
.catch(err => {
  console.log(err.stack);
});
