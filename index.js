'use strict';

const express = require('express');
const compression = require('compression');
const i18next = require('i18next');
const middleware = require('i18next-express-middleware');
const path = require('path');
const app = express();

app.use(compression({threshold: 0}));
app.use(require('helmet')());

const routes = require('./routes.js');
const slides = require('./slides.js');
const base64 = require('./base64.js');

base64.encodeAssets()
.then((encoded) => {
  app.locals.encoded = encoded;
})
.then(slides.prepare())
.then(() => {
  // Initialize i18n
  const i18nextOptions = {
    fallbackLng: 'en',
    resources: require('./translations.json'),
    detection: {
      order: ['querystring'],
      lookupQuerystring: 'locale',
    },
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
  app.use('/', express.static(path.join(__dirname, 'public')));

  // Setup dynamic routes
  app.get('/', routes.getIndex);
  app.get('/raw', routes.getPageSpeedRaw);
  app.get('/processed', routes.getPageSpeedProcessed);
  app.get('/report', routes.getPageSpeedReport);
  app.get('/slides', routes.getPageSpeedSlides);
  app.get('/screenshot', routes.getScreenshot);

  // Start server
  const server = app.listen(process.env.PORT || 3000, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.log('PageSpeed InSlides™ running at http://%s:%s', host, port);
  });
})
.catch((err) => {
  console.error(err.stack);
});
