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

const phantom = require('phantom');
const path = require('path');
const randomUserAgent = require('random-fake-useragent');

const USER_AGENT = randomUserAgent.getRandom('Chrome');

const screenshot = {
  getScreenshot(url, options) {
    let format = options.format;
    let viewPort = options.viewPort;
    let pageSize = options.pageSize;
    let pageOrientation = options.pageOrientation;
    let pageMarginInCm = options.pageMarginInCm;

    const dpi = 72;
    let fileName;

    let page = null;
    let instance = null;

    return phantom.create([
      '--ignore-ssl-errors=yes',
      '--web-security=no',
      '--load-images=true',
      '--local-to-remote-url-access=true',
    ])
    .then((instance_) => {
      console.log('Creating instance');
      instance = instance_;
      return instance.createPage();
    })
    .then((page_) => {
      console.log('Creating page');
      page = page_;
      page.on('onError', (msg) => {
        // Silently ignore page errors
      });
      page.on('onLoadFinished', (msg) => {
        console.log('onLoadFinished', msg);
      });
      page.on('onConsoleMessage', (msg) => {
        console.log('From Phantom.js (console.log):', msg);
      });
      page.on('onCallback', (msg) => {
        console.log('From Phantom.js (phantomCallback): type', typeof msg);
      });
      return page.property('settings', {
        userAgent: USER_AGENT,
        javascriptEnabled: true,
        loadImages: true,
        localToRemoteUrlAccessEnabled: true,
        webSecurityEnabled: false,
      });
    })
    .then(() => {
      // Adapted from http://stackoverflow.com/questions/22017746/
      pageSize = (pageSize || 'A4');
      pageOrientation = (pageOrientation || 'portrait');
      pageMarginInCm = pageMarginInCm || 0.5;
      let pdfViewPortWidth;
      let pdfViewPortHeight;
      const cmToInchFactor = 0.393701;
      let widthInInches;
      let heightInInches;
      switch (pageSize) {
        case 'Letter':
          widthInInches = 8.5;
          heightInInches = 11;
          break;
        case 'Legal':
          widthInInches = 8.5;
          heightInInches = 14;
          break;
        case 'A3':
          widthInInches = 11.69;
          heightInInches = 16.54;
          break;
        case 'A4':
          widthInInches = 8.27;
          heightInInches = 11.69;
          break;
        case 'a5':
          widthInInches = 5.83;
          heightInInches = 8.27;
          break;
        case 'tabloid':
          widthInInches = 11;
          heightInInches = 17;
          break;
        default:
          widthInInches = 8.27;
          heightInInches = 11.69;
      }
      // Reduce by the margin (assuming 1cm margin on each side)
      widthInInches -= 2 * pageMarginInCm * cmToInchFactor;
      heightInInches -= 2 * pageMarginInCm * cmToInchFactor;
      // Interchange if width is equal to height
      if (pageOrientation === 'landscape') {
        const temp = widthInInches;
        widthInInches = heightInInches;
        heightInInches = temp;
      }
      // Calculate corresponding view port dimension in pixels
      pdfViewPortWidth = Math.floor(dpi * widthInInches);
      pdfViewPortHeight = Math.floor(dpi * heightInInches);
      viewPort = {
        width: pdfViewPortWidth,
        height: pdfViewPortHeight,
      };
      const pageSizeOptions = {
        format: pageSize,
        orientation: pageOrientation,
        margin: pageMarginInCm + 'cm',
      };
      console.log('Setting page size to ' + JSON.stringify(pageSizeOptions));
      return page.property('paperSize', pageSizeOptions);
    })
    .then(() => {
      console.log('Setting view port to ' + JSON.stringify(viewPort));
      return page.property('viewportSize', viewPort);
    })
    .then(() => {
      console.log('Setting DPI to ', dpi);
      return page.property('dpi', dpi);
    })
    .then(() => {
      console.log('Start opening');
      return page.open(url);
    })
    .then((status) => {
      console.log('Status', status);
      if (status !== 'success') {
        return Promise.reject(Error('Can\'t open page ' + url + '. Status: ' +
            status));
      }
      fileName = path.join('screenshots', format,
          Date.now() + '.' + format);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('Start rendering');
          page.render(fileName)
          .then(() => {
            return resolve(fileName);
          });
        }, 2000);
      });
    })
    .then(() => {
      console.log('Exiting');
      page.close().then(() => instance.exit());
      return Promise.resolve(fileName);
    }).catch((err) => {
      console.error(err);
    });
  },
};

module.exports = screenshot;
