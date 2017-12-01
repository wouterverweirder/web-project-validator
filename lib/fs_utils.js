'use strict';

const fetch = require(`node-fetch`),
  mkdirp = require(`mkdirp`),
  rimraf = require(`rimraf`);

/**
 * adds file:// prefix for local paths
 * does not add a protocol if input already has a protocol
 * uri encodes when necessary
 * keeps querystrings, removes anchors
 */
const getPathWithProtocol = input => {
  let output = `${input}`;
  if (!pathHasProtocol(output)) {
    //if output starts with a . resolve it to absolute path
    if (output.indexOf(`.`) === 0) {
      output = require(`path`).resolve(output);
    }
    output = `file://${output}`;
  }
  output = encodeURI(decodeURI(output));
  output = getPathWithoutAnchor(output);
  return output;
};

/**
 * return the folder we would use locally to store info about a given resource
 * we expect a resource object (with property remotePath) and the output context (output folder path)
 */
const getLocalFolderPathForResource = (resource, contextPath) => {
  if (!resource || typeof resource.url !== `string` || typeof contextPath !== `string`) {
    throw `getLocalFolderPathForResource expects a resource object and a context`;
  }
  if (!pathHasProtocol(resource.url)) {
    throw `resource.url (${resource.url}) has no protocol`;
  }
  contextPath = getPathWithoutTrailingSlash(contextPath);
  let output = getSanitizedLocalPath(`${resource.url}`);
  //handle port
  const parsed = require(`url`).parse(resource.url);
  if (parsed.port) {
    const splitted = output.split(`/`);
    splitted[1] = `${splitted[1].split(`:`)[0]}/${parsed.port}`;
    output = splitted.join(`/`);
  }
  //handle querystring parameters
  if (hasQueryString(resource.url)) {
    output = `${output}/__QUERYSTRING__`;
    const queryStringObject = getQueryStringAsObject(resource.url);
    let queryStringKeys = Object.keys(queryStringObject);
    queryStringKeys = queryStringKeys.sort();
    queryStringKeys.forEach(queryStringKey => {
      output = `${output}/${queryStringKey}/${queryStringObject[queryStringKey]}`;
    });
  }
  output = `${contextPath}${output}/__META__/`;
  return output;
};

const getSanitizedRemoteUrl = inputUrl => {
  let output = getPathWithProtocol(inputUrl);
  output = getPathWithoutQueryString(output);
  output = getPathWithoutAnchor(output);
  return output;
};

const getSanitizedLocalPath = inputUrl => {
  let output = getPathWithoutProtocol(inputUrl);
  output = getPathWithoutQueryString(output);
  output = getPathWithoutAnchor(output);
  output = getPathWithoutTrailingSlash(output);
  //if output starts with a . resolve it to absolute path
  if (output.indexOf(`.`) === 0) {
    output = require(`path`).resolve(output);
  }
  //output needs to start with a slash
  if (output.indexOf(`/`) !== 0) {
    output = `/${output}`;
  }
  output = decodeURI(output);
  return output;
};

const getBasename = inputUrl => {
  let output = getSanitizedRemoteUrl(inputUrl);
  output = require(`path`).basename(output);
  return output;
};

/**
 * loads a given url or file
 * returns a promise which resolves to the file content
 * promise will reject if the file cannot be found
 */
const loadFile = (sourceUrl, encoding = false) => {
  return new Promise((resolve, reject) => {
    sourceUrl = getPathWithProtocol(sourceUrl);
    if (pathIsRemoteUrl(sourceUrl)) {
      return loadRemoteFile(sourceUrl, encoding)
      .then(result => resolve(result))
      .catch(e => reject(e));
    } else {
      return loadLocalFile(sourceUrl, encoding)
      .then(result => resolve(result))
      .catch(e => reject(e));
    }
  });
};

/**
 * loads a given url or file and saves it to the local filesystem
 * returns a promise which resolves to the file content
 * promise will reject if the file cannot be found or saved
 */
const downloadFile = (sourceUrl, targetUrl, encoding = false) => {
  targetUrl = getSanitizedLocalPath(targetUrl);
  return loadFile(sourceUrl, encoding)
  .then(fileContents => {
    return writeFile(targetUrl, fileContents)
    .then(() => fileContents);
  });
};

/**
 * load a remote file, used by loadFile
 */
const loadRemoteFile = (sourceUrl, encoding = false) => {
  return fetch(sourceUrl)
  .then(response => {
    if (response.status > 400) {
      throw `file not found`;
    }
    return response;
  })
  .then(response => {
    if (encoding) {
      return response.text();
    }
    return response;
  });
};

const loadLocalFile = (sourceUrl, encoding = false) => {
  sourceUrl = getSanitizedLocalPath(sourceUrl);
  return statPromised(sourceUrl)
  .catch(() => {
    throw `file not found`;
  })
  .then(stats => {
    if (stats.isDirectory()) {
      throw `${sourceUrl} is a directory`;
    }
  })
  .then(() => readFilePromised(sourceUrl))
  .then(readFileResult => {
    if (encoding) {
      return readFileResult.toString();
    }
    return readFileResult;
  });
};

const readFilePromised = filePath => {
  return new Promise((resolve, reject) => {
    require(`fs`).readFile(filePath, (error, result) => {
      if (error) {
        return reject(`file not found`);
      }
      return resolve(result);
    });
  });
};

const writeFile = (filePath, data, options) => {
  filePath = getSanitizedLocalPath(filePath);
  return new Promise((resolve, reject) => {
    const folderName = require(`path`).resolve(filePath, `..`);
    mkdirpPromised(folderName)
    .then(() => {
      require(`fs`).writeFile(filePath, data, options, error => {
        if (error) {
          return reject(error);
        }
        return resolve(filePath);
      });
    });
  });
};

const mkdirpPromised = folderPath => {
  folderPath = getSanitizedLocalPath(folderPath);
  return new Promise((resolve, reject) => {
    mkdirp(folderPath, error => {
      if (error) {
        return reject(error);
      }
      return resolve(folderPath);
    });
  });
};

const rimrafPromised = folderPath => {
  folderPath = getSanitizedLocalPath(folderPath);
  return new Promise((resolve, reject) => {
    rimraf(folderPath, {}, error => {
      if (error) {
        return reject(error);
      }
      return resolve(folderPath);
    });
  });
};

const getFullUrl = (base, relativePath) => {
  base = getPathWithProtocol(getPathWithoutQueryString(base));
  return require(`url`).resolve(base, relativePath);
};

const getRelativeUrl = (base, fullUrl) => {
  const path = require(`path`);
  base = getPathWithProtocol(getPathWithoutQueryString(base));
  fullUrl = getPathWithProtocol(getPathWithoutQueryString(fullUrl));
  //other domain? no relative path
  if (pathIsRemoteUrl(fullUrl)) {
    if (!pathIsRemoteUrl(base)) {
      return fullUrl;
    }
    const baseDomain = getUrlDomain(base);
    const fullUrlDomain = getUrlDomain(fullUrl);
    if (baseDomain !== fullUrlDomain) {
      return fullUrl;
    }
  }
  return path.relative(base, fullUrl);
};

const getUrlsFromList = inputPath => {
  return loadLocalFile(inputPath, `utf-8`)
  .then(content => {
    let lines = content.split(/\r?\n/);
    lines = lines.filter(line => line.trim().length > 0);
    lines = lines.map(filePath => getPathWithProtocol(filePath));
    //make them unique
    const linesByUrl = {};
    lines.forEach(line => linesByUrl[line] = line);
    lines = Object.keys(linesByUrl);
    return lines;
  });
};

const getHtmlFilesFromDirectory = input => {
  return new Promise((resolve, reject) => {
    require(`glob`)(`${input}/**/*.{htm,html}`, {}, (err, files) => {
      if (err) {
        return reject(err);
      }
      files = files.map(filePath => getPathWithProtocol(filePath));
      return resolve(files);
    });
  });
};

const statPromised = filePath => {
  filePath = getSanitizedLocalPath(filePath);
  return new Promise((resolve, reject) => {
    require(`fs`).stat(filePath, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};

const pathIsRemoteUrl = input => {
  const parsed = require(`url`).parse(input);
  return (parsed.protocol !== null && parsed.protocol !== `file:`);
};

const getUrlDomain = inputUrl => {
  const parsed = require(`url`).parse(inputUrl);
  return parsed.hostname;
};

const pathHasProtocol = input => {
  const parsed = require(`url`).parse(input);
  return (parsed.protocol !== null);
};

const getPathWithoutProtocol = input => {
  return input.replace(/.*?:\/\//g, ``);
};

const getPathWithoutQueryString = input => {
  return input.split(`?`)[0];
};

const getPathWithoutAnchor = input => {
  return input.split(`#`)[0];
};

const getPathWithoutTrailingSlash = input => {
  return input.replace(/\/$/, ``);
};

const hasQueryString = input => {
  const parsed = require(`url`).parse(input);
  if (!parsed.query) {
    return false;
  }
  return true;
};

const getQueryStringAsObject = input => {
  const parsed = require(`url`).parse(input);
  if (!parsed.query) {
    return {};
  }
  return require(`querystring`).parse(parsed.query);
};

module.exports = {
  downloadFile,
  getBasename,
  getSanitizedLocalPath,
  getSanitizedRemoteUrl,
  getFullUrl,
  getRelativeUrl,
  getPathWithProtocol,
  getPathWithoutProtocol,
  getPathWithoutAnchor,
  getPathWithoutQueryString,
  getLocalFolderPathForResource,
  getHtmlFilesFromDirectory,
  getUrlsFromList,
  loadFile,
  mkdirpPromised,
  pathIsRemoteUrl,
  rimrafPromised,
  statPromised,
  writeFile
};
