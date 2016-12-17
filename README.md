# Basic HTML Project Validator

Analyse an html project automatically and get a report with info on:

- html validation
- html outline (using h5o)
- css quality (using stylelint)
- file naming (use lowercase characters, no special characters, ...)
- file resolving (get reports if referenced files cannot be found)
- images (which images are loaded from image tags, which images are css background images)

## Installation

The validator runs on node 5+. There are 2 additional dependencies:

### PhantomJS

PhantomJS needs to be installed globally:

```sh
$ npm install -g phantomjs-prebuilt
```

### JDK

You will need a recent version of JAVA, as the offline w3c validator depends on that.
On OSX this might be a challenge. These are the steps I followed to update my Java version:

1. Download the latest JDK version on http://www.oracle.com/technetwork/java/javase/downloads/index.html
2. Run the installer
3. In Terminal, navigate to the following location:

  ```sh
  $ cd /System/Library/Frameworks/JavaVM.framework/Versions/
  ```

4. Remove the CurrentJDK symlink in this directory:

  ```sh
  $ sudo rm CurrentJDK
  ```

  Note: if you get an error saying "Operation Not Permitted", it probably means you've got System Integrity Protection active (new security feature since OSX El Capitan). Check the stackoverflow answer at http://stackoverflow.com/a/33681751 on how to disable this and try removing the symlink again.

5. Link the JDK you just installed as CurrentJDK:

  ```sh
  $ sudo ln -s /Library/Java/JavaVirtualMachines/jdk1.8.0_65.jdk/Contents/ CurrentJDK
  ```

6. Run java -version - it should output the java version you just installed:

  ```sh
  $ java -version
  java version "1.8.0_65"
  Java(TM) SE Runtime Environment (build 1.8.0_65-b17)
  Java HotSpot(TM) 64-Bit Server VM (build 25.65-b01, mixed mode)
  ```

## Usage

### Get a report on a url

```sh
$ node app.js https://github.com
```

### Get a report on one html file

```sh
$ node app.js path/to/the/html/file
```

### Get a report on a folder

This will scan a folder recursively, and create a report on every html file it finds inside that folder and its subfolders.

```sh
$ node app.js path/to/the/folder
```

### Get a report on a list of urls

This will validate the urls specified in a given file. Urls inside this file are separated by enters.

```sh
$ node app.js urls.txt
```
