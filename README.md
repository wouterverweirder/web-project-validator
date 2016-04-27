# Basic HTML Project Validator

Analyse an html project automatically and get a report with info on:

- html validation (using validator.nu)
- html outline (using h5o)
- css quality (using csslint)
- file naming (use lowercase characters, no special characters, ...)
- file resolving (get reports if referenced files cannot be found)
- screenshots (phantomjs & firefox)

## Installation

The validator runs on node 4.x. There are some additional dependencies:

### JDK

You will need a recent version of JAVA, as the offline w3c validator depends on that.
On OSX this might be a challenge. These are the steps I followed to update my Java version:

1. Download the latest JDK version on http://www.oracle.com/technetwork/java/javase/downloads/index.html
2. Run the installer
3. In Terminal, navigate to the following location:

  ```
  $ cd /System/Library/Frameworks/JavaVM.framework/Versions/
  ```

4. Remove the CurrentJDK symlink in this directory:

  ```
  $ sudo rm CurrentJDK
  ```

5. Link the JDK you just installed as CurrentJDK:

  ```
  $ sudo ln -s /Library/Java/JavaVirtualMachines/jdk1.8.0_65.jdk/Contents/ CurrentJDK
  ```

6. Run java -version - it should output the java version you just installed:

  ```
  $ java -version
  java version "1.8.0_65"
  Java(TM) SE Runtime Environment (build 1.8.0_65-b17)
  Java HotSpot(TM) 64-Bit Server VM (build 25.65-b01, mixed mode)
  ```

### Selenium

You will need to have selenium server running.

1. Download selenium standalone server

  ```
  $ curl -O http://selenium-release.storage.googleapis.com/2.48/selenium-server-standalone-2.48.2.jar
  ```

2. Start selenium server and keep it running in a terminal window

  ```
  $ java -jar selenium-server-standalone-2.48.2.jar
  ```

### NPM installs

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
$ node app.js --input-file path/to/the/html/file
```

### Get a report on a folder

This will scan a folder recursively, and create a report on every html file it finds inside that folder and its subfolders.

```
$ node app.js --input-folder path/to/the/folder
```

### Get a report on a url

```
$ node app.js --input-url https://github.com
```

### Get a report on a list of urls

This will validate the urls specified in a given file. Urls inside this file are separated by enters.

```
$ node app.js --input-list urls.txt
```

### Use the offline w3c validator instead of the online validator

If you send too many requests to the online validator, you will be blocked for an hour. In those cases you could use the offline, java-based validator:

```
$ node app.js --input-file path/to/the/html/file --html-validator offline
```
