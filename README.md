# Basic HTML Project Validator

Analyse an html project automatically and get a report with info on:

- html validation (using validator.nu)
- html outline (using h5o)
- css quality (using csslint)
- file naming (use lowercase characters, no special characters, ...)
- file resolving (get reports if referenced files cannot be found)

## Installation

Make sure you have phantomjs installed globally:

```
$ npm install -g phantomjs
```

After that, just run npm install, to get all the dependencies:

```
$ npm install
```

## Usage

### Get a report on one html file

```
$ node app.js --input-file path/to/the/html/file > report.txt
```

### Get a report on a folder

This will scan a folder recursively, and create a report on every html file it finds inside that folder and its subfolders.

```
$ node app.js --input-folder path/to/the/folder > report.txt
```
