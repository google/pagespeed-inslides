const fs = require('fs');
const path = require('path');

const ls = start => {
  return new Promise((resolve, reject) => {
    fs.readdir(start, (err, files) => {
      if (err) {
        return reject(err);
      }
      // Don't return hidden files
      files = files.filter(name => !/^\./.test(name));
      return resolve(files.map(file => path.join(start, file)));
    });
  });
};

const base64 = {
  encodeAssets() {
    let files = [];
    return ls(path.join(__dirname, 'public', 'images'))
    .then(files_ => {
      files = files_;
      return Promise.all(
        files.map(file => fs.readFileSync(file).toString('base64'))
      );
    })
    .then(encoded => {
      const results = {};
      files.forEach((file, i) => {
        results[file] = encoded[i];
      });
      return results;
    });
  }
};

module.exports = base64;
