'use strict';

const phantom = require('phantom');
const randomUserAgent = require('random-fake-useragent');
const path = require('path');
const fs = require('fs');

const USER_AGENT = randomUserAgent.getRandom('Chrome');

const createHAR = (url, title, startTime, onLoadTime, onContentLoadTime,
    resources) => {
  let entries = [];

  resources.forEach((resource) => {
    const {request, startReply, endReply} = resource;
    if (!request || !startReply || !endReply) {
      return;
    }
    // Exclude data URIs from HAR file
    if (/^data:image\/.*/i.test(request.url)) {
      return;
    }

    request.time = new Date(request.time);
    startReply.time = new Date(startReply.time);
    endReply.time = new Date(endReply.time);
    entries.push({
      startedDateTime: request.time.toISOString(),
      time: endReply.time - request.time,
      request: {
        method: request.method,
        url: request.url,
        httpVersion: 'unknown', // Check if we can get this
        cookies: request.cookies || [],
        headers: request.headers || [],
        queryString: request.queryString || [],
        postData: request.postData || {},
        headersSize: -1,
        bodySize: -1,
        comment: '',
      },
      response: {
        status: endReply.status,
        statusText: endReply.statusText,
        httpVersion: 'unknown', // Check if we can get this
        cookies: endReply.cookies || [],
        headers: endReply.headers || [],
        content: {
          size: startReply.bodySize,
          mimeType: endReply.contentType || '',
        },
        redirectURL: endReply.redirectURL || '',
        headersSize: -1,
        bodySize: startReply.bodySize,
        comment: '',
      },
      cache: {},
      timings: {
        blocked: 0,
        dns: -1,
        connect: -1,
        send: 0,
        wait: startReply.time - request.time,
        receive: endReply.time - startReply.time,
        ssl: -1,
      },
      pageref: url,
    });
  });

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'PhantomJS',
        version: '2.1.1',
      },
      pages: [{
        startedDateTime: startTime.toISOString(),
        id: url,
        title: title,
        pageTimings: {
          onLoad: onLoadTime - startTime,
          onContentLoad: onContentLoadTime - startTime,
        },
      }],
      entries: entries,
    },
  };
};

const waterfall = {
  create(url) {
    let page = null;
    let instance = null;
    let har = null;

    let resources = [];
    let startTime;
    let onLoadTime;
    let onContentLoadTime;
    let title;

    return phantom.create([
      '--ignore-ssl-errors=yes',
      '--web-security=no',
      '--load-images=true',
      '--local-to-remote-url-access=true',
    ])
    .then((instance_) => {
      instance = instance_;
      return instance.createPage();
    })
    .then((page_) => {
      page = page_;

      page.on('onError', (msg) => {
        return Promise.reject(msg);
      });

      page.on('onLoadStarted', () => {
        startTime = new Date();
      });

      page.on('onResourceRequested', (req) => {
        resources[req.id] = {
          request: req,
          startReply: null,
          endReply: null,
        };
      });

      page.on('onResourceReceived', (res) => {
        if (res.stage === 'start') {
          resources[res.id].startReply = res;
        } else if (res.stage === 'end') {
          resources[res.id].endReply = res;
        }
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
      return page.open(url);
    })
    .then((status) => {
      if (status !== 'success') {
        instance.exit();
        return Promise.reject(status);
      }
      onLoadTime = new Date();
      return page.property('content');
    })
    .then(() => {
      onContentLoadTime = new Date();
      return page.evaluate(function() {
        return document.title;
      });
    })
    .then((title_) => {
      title = title_;
      return createHAR(url, title, startTime, onLoadTime, onContentLoadTime,
          resources);
    })
    .then((har_) => {
      har = har_;
      page.close();
      // Start with a fresh page instance
      return instance.createPage();
    })
    .then((page_) => {
      page = page_;
      return page.injectJs(path.join(__dirname, 'node_modules', 'perf-cascade',
          'dist', 'perf-cascade.js'));
    })
    .then((success) => {
      if (!success) {
        return Promise.reject(success);
      }
      const script = `
          function() {
            var body = document.body;

            var output = document.createElement('div');
            output.id = 'output';
            body.appendChild(output);

            var legendHolder = document.createElement('div');
            output.appendChild(legendHolder);

            window.phantomVar = ${JSON.stringify(har)};
            var options = {
              legendHolder: legendHolder,
              leftColumnWith: 30
            };
            var svg = perfCascade.fromHar(window.phantomVar.log, options);
            output.appendChild(svg);
            return output.innerHTML;
          }`;
      return page.evaluateJavaScript(script);
    })
    .then((svg) => {
      if (!svg) {
        return Promise.reject(svg);
      }
      svg = svg.replace(/svg:svg/g, 'svg');
      page.close();
      instance.exit();
      return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'node_modules', 'perf-cascade',
            'dist', 'perf-cascade.css');
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            return reject(err);
          }
          return resolve({
            svg: svg,
            css: data,
          });
        });
      });
    })
    .catch((e) => {
      if (e) {
        console.log(e);
      }
    });
  },
};

module.exports = waterfall;
