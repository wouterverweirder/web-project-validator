'use strict';

const stylelint = require(`stylelint`);
const ruleName = `devinehowest/has-flexbox`;

const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: `Expected To Use Flexbox`,
});

const myPluginRule = stylelint.createPlugin(ruleName, () => {
  return (postcssRoot, postcssResult) => {

    const flexboxCheck = {
      display: {
        flex: 0
      }
    };

    const checkStatement = node => {
      if (undefined === flexboxCheck[node.prop]) {
        return;
      }
      if (undefined === flexboxCheck[node.prop][node.value]) {
        return;
      }
      flexboxCheck [node.prop][node.value]++;
    };

    postcssRoot.walkDecls(checkStatement);

    if (flexboxCheck[`display`][`flex`] === 0) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: postcssRoot,
        message: `no usage of display:flex on any node`
      });
    }
  };
});

module.exports = myPluginRule;
module.exports.ruleName = ruleName;
module.exports.messages = messages;
