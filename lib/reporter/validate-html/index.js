'use strict';

var fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars');

var generateIndent = require('../../indent_utils').generateIndent;

var generateReport = function(validatorReport, htmlValidator, fileContents) {
  return new Promise(function(resolve, reject){
    htmlValidator.validate(fileContents)
    .then(messages => {
      //group messages by message
      const messagesByMessageText = {};
      messages.forEach(message => {
        if(!messagesByMessageText[message.message]) {
          messagesByMessageText[message.message] = [];
        }
        messagesByMessageText[message.message].push(message);
      });
      return messagesByMessageText;
    })
    .then(messagesByMessageText => {
      const dangerMessages = [];
      const warningMessages = [];
      const infoMessages = [];
      const messages = [];
      for(const messageText in messagesByMessageText) {
        const message = {
          outputType: getOutputTypeForMessage(messagesByMessageText[messageText][0]),
          message: messageText,
          evidence: '',
          numMessages: 0
        };
        messagesByMessageText[messageText].forEach(messageObject => {
          if(messageObject.lastLine) {
            message.evidence += "line " + messageObject.lastLine + ": \n";
          }
          if(messageObject.extract) {
            message.evidence += messageObject.extract + "\n\n";
          }
          message.numMessages++;
        });
        if(message.outputType === 'danger') {
          dangerMessages.push(message);
          messages.push(message);
        } else if(message.outputType === 'warning'){
          warningMessages.push(message);
          messages.push(message);
        } else {
          infoMessages.push(message);
        }
      }
      Object.assign(validatorReport, {
        numErrors: dangerMessages.length,
        numWarnings: warningMessages.length,
        messages: messages,
        dangerMessages: dangerMessages,
        warningMessages: warningMessages,
        infoMessages: infoMessages
      });
      resolve(validatorReport);
    });
  });
};

const getOutputTypeForMessage = message => {
  if(message.type === 'error') {
    return 'danger';
  }
  if(message.subType && message.subType === 'warning') {
    return 'warning';
  }
  return 'info';
};

var convertReportToHtml = function(report, options) {
  return new Promise(function(resolve, reject){
    if(!options) {
      options = {};
    }
    if(!options.indentLevel) {
      options.indentLevel = 0;
    }
    fs.readFile(path.resolve(__dirname, 'template.hbs'), 'utf-8', function(error, source){
      if(error) {
        return reject(error);
      }
      var template = handlebars.compile(source);
      var output = template(Object.assign({}, report, {
        indentLevel: options.indentLevel+1,
        indentLevel2: options.indentLevel+2,
        indentLevel3: options.indentLevel+3
      }));
      resolve(output);
    });
  });
};

var exit = function() {
  htmlValidator.close();
};

module.exports = {
  generateReport: generateReport,
  convertReportToHtml: convertReportToHtml,
  exit: exit
};
