/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const path = require('path');
const request = require('request');
const env = require('node-env-file');
env(path.join(__dirname, '.env'), {raise: false});

const API_KEY = process.env.API_KEY;

const mobileFriendlyTest = {
  run(params) {
    return new Promise((resolve, reject) => {
      if (!params.mobileFriendlyTest || params.mobileFriendlyTest !== 'true') {
        return resolve(false);
      }
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
      request.post(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
          console.error(err || `Status code ${response.statusCode}\n
              ${JSON.stringify(data, null, 2)}`.replace(/\n\s+/, '\n'));
          // Mobile-friendliness results are non-critical, just fail silently
          return resolve({
            testStatus: {
              status: err || `Status code ${response.statusCode}`,
            },
          });
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
