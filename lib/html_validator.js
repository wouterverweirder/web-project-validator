'use strict';

let vnu = false;

const start = () => {
  return new Promise((resolve, reject) => {
    if (isRunning()) {
      return resolve();
    }
    console.log(`launch validator-nu process...`);
    const VnuClass = require(`validator-nu`).Vnu;
    vnu = new VnuClass();
    vnu.open()
    .then(
      () => resolve(),
      e => reject(e)
    );
  });
};

const stop = () => {
  return new Promise(resolve => {
    if (!isRunning()) {
      return resolve();
    }
    console.log(`close validator-nu process...`);
    vnu.close();
    vnu = false;
    resolve();
  });
};

const isRunning = () => {
  return (vnu !== false);
};

const validateHtmlFile = filePath => {
  return start()
  .then(() => vnu.validateFiles([filePath]))
  .then(result => processValidatorResult(result[filePath]));
};

const processValidatorResult = validationMessages => {
  const validatorReport = {
    numErrors: 0,
    numWarnings: 0,
    errors: [],
    warnings: []
  };
  //group messages by message
  const groupedMessages = getValidationMessagesGroupedByMessage(validationMessages);
  groupedMessages.forEach(message => {
    if (message.outputType === `danger`) {
      validatorReport.errors.push(message);
      validatorReport .numErrors++;
    } else {
      validatorReport.warnings.push(message);
      validatorReport .numWarnings++;
    }
  });
  return validatorReport;
};

const getValidationMessagesGroupedByMessage = validationMessages => {
  const messagesByMessageText = {};
  validationMessages.forEach(message => {
    //ignore regular info messages
    if (message.type === `info` && !message.subType) {
      return;
    }
    if (!messagesByMessageText[message.message]) {
      messagesByMessageText[message.message] = createBasicMessage(message);
    }
    messagesByMessageText [message.message].numMessages++;
    messagesByMessageText[message.message].evidence.push(createEvidenceFromMessage(message));
  });
  const messageTexts = Object.keys(messagesByMessageText);
  return messageTexts.map(messageText => messagesByMessageText[messageText]);
};

const createBasicMessage = validationMessage => {
  return {
    outputType: getOutputTypeForMessage(validationMessage),
    message: validationMessage.message,
    evidence: [],
    numMessages: 0
  };
};

const createEvidenceFromMessage = validationMessage => {
  const evidence = {
    line: false,
    extract: false
  };
  if (validationMessage.lastLine) {
    evidence.line = validationMessage.lastLine;
  }
  if (validationMessage.extract) {
    evidence.extract = validationMessage.extract;
  }
  return evidence;
};

const getOutputTypeForMessage = validationMessage => {
  if (validationMessage.type === `error`) {
    return `danger`;
  }
  return `warning`;
};

//stop when process exits
const exitHandler = options => {
  if (options.cleanup) {
    stop();
  }
  if (options.exit) process.exit();
};

//do something when app is closing
process.on(`exit`, exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on(`SIGINT`, exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on(`uncaughtException`, exitHandler.bind(null, {exit: true}));

module.exports = {
  start,
  stop,
  isRunning,
  validateHtmlFile
};
