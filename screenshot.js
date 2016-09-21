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
    let fileName;

    let page = null;
    let instance = null;

    return phantom.create(['--ignore-ssl-errors=yes', '--web-security=no'])
    .then(instance_ => {
      console.log('Creating instance');
      instance = instance_;
      return instance.createPage();
    }).then(page_ => {
      console.log('Creating page');
      page = page_;
      page.property('settings', {userAgent: USER_AGENT})
      .then(() => {
        return page;
      });
    }).then(() => {
      // Adapted from http://stackoverflow.com/questions/22017746/
      pageSize = (pageSize || 'A4');
      pageOrientation = (pageOrientation || 'portrait');
      pageMarginInCm = pageMarginInCm || 1;
      const dpi = 150;
      let pdfViewPortWidth = 1024;
      let pdfViewPortHeight = 768;
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
        height: pdfViewPortHeight
      };
      const pageSizeOptions = {
        format: pageSize,
        orientation: pageOrientation,
        margin: pageMarginInCm + 'cm'
      };
      console.log('Setting page size to ' + JSON.stringify(pageSizeOptions));
      return page.property('paperSize', pageSizeOptions);
    }).then(() => {
      console.log('Setting view port to ' + JSON.stringify(viewPort));
      return page.property('viewportSize', viewPort);
    }).then(() => {
      console.log('Setting DPI to 150');
      return page.property('dpi', 150);
    }).then(() => {
      return page.open(url);
    }).then(status => {
      console.log('Status', status);
      if (status !== 'success') {
        return Promise.reject(Error('Can\'t open page ' + url + '. Status: ' +
            status));
      }
      fileName = path.join('screenshots', format,
          Date.now() + '.' + format);
      return page.render(fileName);
    }).then(() => {
      instance.exit();
      page.close();
      return Promise.resolve(fileName);
    }).catch(err => {
      console.log(err);
    });
  }
};

module.exports = screenshot;
