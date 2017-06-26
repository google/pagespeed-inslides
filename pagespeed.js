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
const beautifyJs = require('js-beautify').js;
const beautifyCss = require('js-beautify').css;
const beautifyHtml = require('js-beautify').html;
const Prism = require('prismjs');
const randomUserAgent = require('random-fake-useragent');
const request = require('request');
const waterfall = require('./waterfall.js');
const env = require('node-env-file');
env(path.join(__dirname, '.env'), {raise: false});

const API_KEY = process.env.API_KEY;
const USER_AGENT = randomUserAgent.getRandom('Chrome');
const CODE_CHARACTER_LIMIT = 1000;

const pageSpeedInsights = {
  run(params) {
    return new Promise((resolve, reject) => {
      const DEBUG = params.debug || false;
      if (DEBUG) return resolve(require('./tests/static.json'));
      let locale;
      if (params.locale) {
        if (params.locale === 'en-AU') {
          // Manual override for the en-AU easter egg
          locale = 'en';
        } else {
          locale = params.locale;
        }
      } else {
        locale = 'en';
      }
      const PAGESPEEDS_INSIGHTS_URL = `
          https://www.googleapis.com/pagespeedonline/v2/runPagespeed
          ?url=${encodeURIComponent(params.url)}
          &filter_third_party_resources=${
              params.filterThirdPartyResources || 'false'}
          &locale=${locale.replace('-', '_')}
          ${params.rule ? '&rule=' + params.rule : ''}
          &screenshot=${params.screenshot || 'false'}
          ${params.strategy ? '&strategy=' + params.strategy : ''}
          &key=${API_KEY}`.replace(/\n\s*/g, '');
      console.log(PAGESPEEDS_INSIGHTS_URL);
      const options = {
        url: PAGESPEEDS_INSIGHTS_URL,
        json: true,
        timeout: 60000,
      };
      request.get(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
          return reject(Error(err || `Status code ${response.statusCode}\n
              ${JSON.stringify(data, null, 2)}`.replace(/\n\s+/, '\n')));
        }
        return resolve(data);
      });
    });
  },

  format(insights) {
    return new Promise((resolve, reject) => {
      let screenshot;
      if (insights.screenshot) {
        screenshot = insights.screenshot;
        screenshot.mimeType = screenshot.mime_type;
        delete screenshot.mime_type;
        screenshot.pageRect = screenshot.page_rect;
        delete screenshot.page_rect;
        screenshot.data = screenshot.data.replace(/_/g, '/').replace(/-/g, '+');
      }
      const formatted = {
        title: insights.title,
        finalUrl: insights.id,
        screenshot: screenshot,
        resourceTypes: {},
      };

      const scores = {};
      const unorderedRules = {};
      // Work with lowercase group names
      for (const groupName in insights.ruleGroups) {
        if (!{}.hasOwnProperty.call(insights.ruleGroups, groupName)) {
          continue;
        }
        let lowerCaseGroupName = groupName.toLowerCase();
        scores[lowerCaseGroupName] = insights.ruleGroups[groupName].score;
        unorderedRules[lowerCaseGroupName] = [];
      }
      formatted.scores = scores;

      // Order page stats by weights
      const pageStats = {};
      const responseBytes = [];
      const numberResources = [];
      for (const pageStat in insights.pageStats) {
        if (/ResponseBytes$/.test(pageStat)) {
          let localPageStat = {
            name: pageStat,
            weight: parseInt(insights.pageStats[pageStat], 10),
          };
          responseBytes.push(localPageStat);
        } else if (/^number\w+Resources$/.test(pageStat)) {
          let localPageStat = {
            name: pageStat,
            weight: parseInt(insights.pageStats[pageStat], 10),
          };
          numberResources.push(localPageStat);
        } else {
          pageStats[pageStat] = insights.pageStats[pageStat];
        }
      }
      pageStats.orderedNumberResources = numberResources.sort((a, b) => {
        return b.weight - a.weight;
      });
      pageStats.orderedResponseBytes = responseBytes.sort((a, b) => {
        return b.weight - a.weight;
      });
      formatted.pageStats = pageStats;

      // Helper function to expand template strings
      const expandTemplateStrings = (arg, format) => {
        let html = '';
        if (arg.type === 'HYPERLINK') {
          let regEx1 = new RegExp(`{{BEGIN_${arg.key}}}`, 'g');
          let value1 = `<a href="${arg.value}" title="${arg.value}">`;
          if (!/https:\/\/developers\.google\.com\//.test(arg.value)) {
            formatted.resourceTypes[arg.value] = false;
          }
          format = format.replace(regEx1, value1);
          let regEx2 = new RegExp(`{{END_${arg.key}}}`, 'g');
          let value2 = '</a>';
          html = format.replace(regEx2, value2);
        } else if (arg.type === 'URL') {
          let regEx = new RegExp(`{{${arg.key}}}`, 'g');
          let value =
              `<a href="${arg.value}" title="${arg.value}">${arg.value}</a>`;
          if (!/https:\/\/developers\.google\.com\//.test(arg.value)) {
            formatted.resourceTypes[arg.value] = false;
          }
          html = format.replace(regEx, value);
        } else if (arg.type === 'STRING_LITERAL') {
          let regEx = new RegExp(`{{${arg.key}}}`, 'g');
          let value;
          if (arg.key === 'HTML_TEXT') {
            value = `<pre class="prettyprint" data-lang="html">${arg.value
                .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')}</pre>`;
          } else {
            value = `<pre>${arg.value}</pre>`;
          }
          html = format.replace(regEx, value);
        } else if (arg.type === 'SNAPSHOT_RECT') {
          let regEx = /(.*?)\(?\{\{SCREENSHOT\}\}\)?\.?(.*?)/g;
          if (insights.screenshot) {
            let offset = 0;
            const height = insights.screenshot.height;
            const width = insights.screenshot.width;
            const mimeType = insights.screenshot.mimeType;
            const data = insights.screenshot.data;
            let value =
                `<div style="height:${height}px; overflow:hidden;">
                  <img class="screenshot"
                      style="width:${width}px; height:${height}px;"
                      src="data:${mimeType};base64,${data}">
                  ${arg.rects && arg.rects.map((rect) => {
                    const pageRect = insights.screenshot.pageRect;
                    const screenshotWidthRatio = width /
                        (pageRect ? pageRect.width : width);
                    const screenshotHeightRatio = height /
                        (pageRect ? pageRect.height : height);
                    const top = rect.top * screenshotHeightRatio - height -
                        offset;
                    const html =
                        `<div class="highlight primary"
                            style="top:${top}px;
                              left:${rect.left * screenshotWidthRatio}px;
                              width:${rect.width * screenshotWidthRatio}px;
                              height:${rect.height * screenshotHeightRatio}px;"
                        ></div>`;
                    offset += rect.height * screenshotHeightRatio;
                    return html;
                  }).join('')}
                  ${arg.secondary_rects && arg.secondary_rects.map((rect) => {
                    const pageRect = insights.screenshot.pageRect;
                    const screenshotWidthRatio = width /
                        (pageRect ? pageRect.width : width);
                    const screenshotHeightRatio = height /
                        (pageRect ? pageRect.height : height);
                    const top = rect.top * screenshotHeightRatio - height -
                        offset;
                    const html =
                        `<div class="highlight secondary"
                            style="top:${top}px;
                              left:${rect.left * screenshotWidthRatio}px;
                              width:${rect.width * screenshotWidthRatio}px;
                              height:${rect.height * screenshotHeightRatio}px;"
                        ></div>`;
                    offset += rect.height * screenshotHeightRatio;
                    return html;
                  }).join('')}
                </div>`;
            html = format.replace(regEx, '<p>$1</p>' + value + '<p>$2</p>');
          } else {
            html = format.replace(regEx, '<p>$1</p><p>$2</p>');
          }
        } else if (arg.type === 'SCREENSHOT') {

        } else {
          let regEx = new RegExp(`{{${arg.key}}}`, 'g');
          html = format.replace(regEx, arg.value);
        }
        return html;
      };

      // Separate groups
      const ruleResults = insights.formattedResults.ruleResults;
      for (const groupName in unorderedRules) {
        if (!{}.hasOwnProperty.call(unorderedRules, groupName)) {
          continue;
        }
        for (const ruleName in ruleResults) {
          if (!{}.hasOwnProperty.call(ruleResults, ruleName)) {
            continue;
          }
          let contained = (ruleResults[ruleName].groups.map((g) => {
            return g.toLowerCase();
          }).indexOf(groupName) !== -1);
          if (contained) {
            let rule = ruleResults[ruleName];
            if (rule.ruleImpact > 0) {
              let expandedRule = {
                name: ruleName,
                localizedRuleName: rule.localizedRuleName,
                ruleImpact: rule.ruleImpact,
              };
              if (rule.summary) {
                let summary = rule.summary;
                let format = summary.format;
                let args = summary.args || [];
                args.forEach((arg) => {
                  format = expandTemplateStrings(arg, format);
                });
                expandedRule.html = format;
              }
              if (rule.urlBlocks) {
                expandedRule.urlBlocks = [];
                rule.urlBlocks.forEach((urlBlock) => {
                  let urlBlockObject = {};
                  let header = urlBlock.header;
                  let format = header.format;
                  let args = header.args || [];
                  args.forEach((arg) => {
                    format = expandTemplateStrings(arg, format);
                  });
                  urlBlockObject.html = format;
                  urlBlockObject.urls = [];
                  if (urlBlock.urls) {
                    urlBlock.urls.forEach((url) => {
                      let result = url.result;
                      let format = result.format;
                      let args = result.args || [];
                      args.forEach((arg) => {
                        format = expandTemplateStrings(arg, format);
                      });
                      urlBlockObject.urls.push({
                        html: format,
                      });
                    });
                  }
                  expandedRule.urlBlocks.push(urlBlockObject);
                });
              }
              unorderedRules[groupName].push(expandedRule);
            }
          }
        }
      }
      // Order rules by impact
      formatted.orderedRules = {};
      for (const groupName in unorderedRules) {
        if (!{}.hasOwnProperty.call(unorderedRules, groupName)) {
          continue;
        }
        formatted.orderedRules[groupName] = unorderedRules[groupName]
            .sort((a, b) => {
              return b.ruleImpact - a.ruleImpact;
            });
      }
      return resolve(formatted);
    });
  },

  determineResourceTypes(insights) {
    let promises = [];
    for (const url in insights.resourceTypes) {
      if (!{}.hasOwnProperty.call(insights.resourceTypes, url)) {
        continue;
      }
      promises.push(new Promise((resolve) => {
        const options = {
          headers: {'User-Agent': USER_AGENT},
          url: url,
          timeout: 10000,
        };
        // HEAD would be friendlier here, but some Web servers return 403,
        // so going for GET :-/
        request.get(options, (err, response, body) => {
          if (err || response.statusCode !== 200) {
            // Fail silently if the content type can't be determined
            return resolve(false);
          }
          // Fail silently if no content-type header is set
          return resolve({
            'content-type': response.headers['content-type'] || false,
            'content-length': response.headers['content-length'] || body.length,
          });
        });
      }));
    }
    return Promise.all(promises)
    .then((resourceTypes) => {
      let i = 0;
      for (const url in insights.resourceTypes) {
        if (!{}.hasOwnProperty.call(insights.resourceTypes, url)) {
          continue;
        }
        if (resourceTypes[i]) {
          insights.resourceTypes[url] = {
            type: resourceTypes[i]['content-type'],
            size: resourceTypes[i]['content-length'],
          };
        }
        i++;
      }
      return insights;
    });
  },

  beautifyResources(insights) {
    let promises = [];
    /* eslint-disable camelcase */
    const beautifyOptions = {
      indent_size: 2,
      no_preserve_newlines: true,
      wrap_line_length: 80,
      end_with_newline: true,
    };
    /* eslint-enable camelcase */
    for (const url in insights.resourceTypes) {
      if (!{}.hasOwnProperty.call(insights.resourceTypes, url)) {
        continue;
      }
      const type = insights.resourceTypes[url].type;
      if (!/(?:text\/css|javascript|text\/html)/.test(type)) {
        continue;
      }
      promises.push(new Promise((resolve) => {
        const options = {
          gzip: true,
          headers: {'User-Agent': USER_AGENT},
          url: url,
          timeout: 10000,
        };
        request.get(options, (err, response, body) => {
          let beautified = '';
          if (err || response.statusCode !== 200) {
            console.warn(`GET ${url}`, err || response.statusCode);
            // Fail silently if the resource is not available
            return resolve({
              url: url,
              beautified: beautified,
            });
          }
          if (/javascript/.test(type)) {
            beautified = Prism.highlight(beautifyJs(
                body.substr(0, CODE_CHARACTER_LIMIT + 160), beautifyOptions)
                .substr(0, CODE_CHARACTER_LIMIT), Prism.languages.javascript);
          } else if (/text\/html/.test(type)) {
            beautified = Prism.highlight(beautifyHtml(
                body.substr(0, CODE_CHARACTER_LIMIT + 160), beautifyOptions)
                .substr(0, CODE_CHARACTER_LIMIT), Prism.languages.markup);
          } else if (/text\/css/.test(type)) {
            beautified = Prism.highlight(beautifyCss(
                body.substr(0, CODE_CHARACTER_LIMIT + 160), beautifyOptions)
                .substr(0, CODE_CHARACTER_LIMIT), Prism.languages.css);
          }
          return resolve({
            url: url,
            beautified: beautified,
          });
        });
      }));
    }
    return Promise.all(promises)
    .then((beautifieds) => {
      const mapping = {};
      beautifieds.map((beautified) => {
        mapping[beautified.url] = beautified.beautified;
        return true;
      });
      for (const url in mapping) {
        if (!{}.hasOwnProperty.call(mapping, url)) {
          continue;
        }
        insights.resourceTypes[url].beautified = mapping[url];
      }
      return insights;
    });
  },

  getWaterfall(insights) {
    return waterfall.create(insights.finalUrl)
    .then((waterfall) => {
      insights.waterfall = waterfall;
      return insights;
    });
  },
};

module.exports = pageSpeedInsights;
