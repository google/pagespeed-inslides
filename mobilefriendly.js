'use strict';

const path = require('path');
const request = require('request');
const env = require('node-env-file');
env(path.join(__dirname, '.env'));

const API_KEY = process.env.API_KEY;

const mobileFriendlyTest = {
  run(params) {
    return new Promise((resolve, reject) => {
      const MOBILE_FRIENDLY_TEST_URL = `
          https://searchconsole.googleapis.com/v1/urlTestingTools/
          mobileFriendlyTest:run?key=${API_KEY}`.replace(/\n\s*/g, '');
      const options = {
        url: MOBILE_FRIENDLY_TEST_URL,
        json: true,
        timeout: 60000,
        form: {
          url: params.url,
          requestScreenshot: params.requestScreenshot || false,
        },
      };
      console.log(options);
      request.post(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
          return reject(Error(err || `Status code ${response.statusCode}\n
              ${JSON.stringify(data, null, 2)}`.replace(/\n\s+/, '\n')));
        }
        if (data.testStatus.status !== 'COMPLETE') {
          return reject(Error(data.testStatus.status));
        }
        return resolve(data);
      });
    });
  },
};

module.exports = mobileFriendlyTest;
