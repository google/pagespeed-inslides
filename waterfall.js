'use strict';

const phantom = require('phantom');
const randomUserAgent = require('random-fake-useragent');

const USER_AGENT = randomUserAgent.getRandom('Chrome');

const createHAR = (url, title, startTime, onLoadTime, onContentLoadTime,
    resources) => {
  let entries = [];

  resources.forEach(resource => {
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
        cookies: request.cookies,
        headers: request.headers,
        queryString: request.queryString,
        headersSize: -1,
        bodySize: -1
      },
      response: {
        status: endReply.status,
        statusText: endReply.statusText,
        httpVersion: 'unknown', // Check if we can get this
        cookies: endReply.cookies,
        headers: endReply.headers,
        redirectURL: endReply.redirectURL,
        headersSize: -1,
        bodySize: startReply.bodySize,
        content: {
          size: startReply.bodySize,
          mimeType: endReply.contentType
        }
      },
      cache: {},
      timings: {
        blocked: 0,
        dns: -1,
        connect: -1,
        send: 0,
        wait: startReply.time - request.time,
        receive: endReply.time - startReply.time,
        ssl: -1
      },
      pageref: url
    });
  });

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'PhantomJS',
        version: '2.1.0'
      },
      pages: [{
        startedDateTime: startTime.toISOString(),
        id: url,
        title: title,
        pageTimings: {
          onLoad: onLoadTime - startTime,
          onContentLoad: onContentLoadTime - startTime
        }
      }],
      entries: entries
    }
  };
};

const waterfall = {
  create(url) {
    let page = null;
    let instance = null;

    let resources = [];
    let startTime;
    let onLoadTime;
    let onContentLoadTime;
    let title;

    return phantom.create([
      '--ignore-ssl-errors=yes',
      '--web-security=no',
      '--load-images=true',
      '--local-to-remote-url-access=true'
    ]).then(instance_ => {
      instance = instance_;
      return instance.createPage();
    }).then(page_ => {
      page = page_;

      page.on('onError', msg => {
        return Promise.reject(msg);
      });

      page.on('onLoadStarted', () => {
        startTime = new Date();
      });

      page.on('onResourceRequested', req => {
        resources[req.id] = {
          request: req,
          startReply: null,
          endReply: null
        };
      });

      page.on('onResourceReceived', res => {
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
        webSecurityEnabled: false
      });
    }).then(() => {
      return page.open(url);
    }).then(status => {
      if (status !== 'success') {
        instance.exit();
        return Promise.reject(status);
      }
      onLoadTime = new Date();
      return page.property('content');
    }).then(() => {
      onContentLoadTime = new Date();
      return page.evaluate(function() {
        return document.title;
      });
    }).then(title_ => {
      title = title_;
      let har = createHAR(url, title, startTime, onLoadTime, onContentLoadTime,
          resources);
      instance.exit();
      return har;
    });
  }
};

module.exports = waterfall;
