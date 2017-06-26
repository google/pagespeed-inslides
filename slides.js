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

const fs = require('fs');
const path = require('path');

const html2jade = require('html2jade');
const html5Slides = require('html5-slides');
const UglifyJS = require('uglify-js');

const slides = {
  prepare() {
    return html5Slides.load()
    .then((html) => {
      return new Promise((resolve, reject) => {
        // Temporarily turn <pre> into <pre-fix-me> due to
        // https://github.com/donpark/html2jade/issues/99
        html = html.replace(/<pre(.*?)(prettyprint.*?)>/g, '<pre-fix-me$1$2>');
        html = html.replace(/[^"]<\/pre>/g, '></pre-fix-me>');
        // Preserve linebreaks and leading whitespace inside of pre-fix-me
        html = html.replace(
            /(<pre-fix-me.*?>)([\s\S]+?)(<\/pre-fix-me>)/gm,
            (_ignore1, preFixMeOpen, code, preFixMeClose) => {
              return `${preFixMeOpen}${code.split(/\n/g).map((line) => {
                return `<!--_COMMENT_${line.replace(/>\s+</g, '> <')
                    .replace(/^(\s*)/g, (_ignore2, whitespace) => {
                      return Array(whitespace.length + 1).join('_SPACE_');
                    })}_COMMENT_-->`;
              }).join('_LINEBREAK_')}${preFixMeClose}`;
            });
        // Temporarily comment out scripts as they cause trouble in Jade
        html = html.replace(/<script>/g, '<!-- <script>');
        html = html.replace(/<\/script>/g, '</script> -->');
        html = html.replace(/(<script.*?>)([\s\S]+?)(<\/script>)/gm,
            (_ignore1, scriptOpen, code, scriptClose) => {
              return `${scriptOpen}
                  ${UglifyJS.minify(code).code}
                  ${scriptClose}`.replace(/(?:\n\s+)/g, '');
            });
        html2jade.convertHtml(html, {}, (err, jade) => {
          if (err) {
            return reject(err);
          }
          // Convert whitespace and linebreak placeholders back to characters
          jade = jade.replace(/_SPACE_/gm, ' ').replace(/_LINEBREAK_/gm, '\n');
          // Turn <pre-fix-me> back to <pre>
          jade = jade.replace(/pre-fix-me(.*)/g, 'pre$1.');
          jade = jade.replace(
                /\/\/\s*_COMMENT_(?:<span class="pln"> <\/span>)?(?:\s{4})?/g,
                '');
          jade = jade.replace(/_COMMENT_/g, '');
          // Comment scripts back in
          jade = jade.replace(/<\/script>$/gm, '');
          jade = jade.replace(/^(\s*?)\/\/\s*?<script>/gm, '$1script.\n$1  ');
          // Replace empty lines or lines with just a '|'
          jade = jade.replace(/^\s*\|?\s*$\n/gm, '');
          // Create inheritance block
          jade = jade.replace(/^(\s*)\/\/\s$/gm, '$1block slides');
          // Rewrite to Jade placeholders
          // Careful, this uses unescaped string interpolation
          jade = jade.replace(/\{\{(.*?)\}\}/g, '!{$1}');
          // Add variables block
          jade = `block variables\n${jade}`;
          const fileName = path.join(__dirname, 'views/slides.pug');
          fs.writeFile(fileName, jade, 'utf8', (err) => {
            if (err) {
              return reject(err);
            }
            console.log(`HTML5 slides Pug template successfully written`);
            return resolve();
          });
        });
      });
    });
  },
};

module.exports = slides;
