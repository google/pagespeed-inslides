'use strict';

const filesize = require('filesize');
const URL = require('url');
global.Intl = require('intl');

const pageSpeedInsights = require('./pagespeed.js');

const routes = {

  getPageSpeedRaw(req, res) {
    const query = req.query;
    return pageSpeedInsights.run(query)
    .then(raw => {
      return res.send(raw);
    })
    .catch(err => {
      res.status(500).send(err.stack);
    });
  },

  getPageSpeedProcessed(req, res) {
    const query = req.query;
    return pageSpeedInsights.run(query)
    .then(pageSpeedInsights.format)
    .then(pageSpeedInsights.determineResourceTypes)
    .then(pageSpeedInsights.beautifyResources)
    .then(insights => {
      return res.send(insights);
    })
    .catch(err => {
      res.status(500).send(err.stack);
    });
  },

  getPageSpeedReport(req, res) {
    const query = req.query;
    return pageSpeedInsights.run(query)
    .then(pageSpeedInsights.format)
    .then(pageSpeedInsights.determineResourceTypes)
    .then(pageSpeedInsights.beautifyResources)
    .then(insights => {
      res.render('report', {insights: insights});
    })
    .catch(err => {
      res.status(500).send(err.stack);
    });
  },

  getPageSpeedSlides(req, res) {
    const query = req.query;
    return pageSpeedInsights.run(query)
    .then(pageSpeedInsights.format)
    .then(pageSpeedInsights.determineResourceTypes)
    .then(pageSpeedInsights.beautifyResources)
    .then(insights => {
      res.render('dynamic', {
        insights: insights,
        filesize: filesize,
        URL: URL
      });
    })
    .catch(err => {
      res.status(500).send(err.stack);
    });
  }
};

module.exports = routes;
