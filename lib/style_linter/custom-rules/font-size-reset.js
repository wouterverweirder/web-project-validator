'use strict';

const stylelint = require(`stylelint`),
  selectorParser = require(`postcss-selector-parser`);
const ruleName = `devinehowest/font-size-reset`;

const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: `Expected correct border box reset`,
});

const myPluginRule = stylelint.createPlugin(ruleName, () => {
  return (postcssRoot, postcssResult) => {

    const fontSizeCheck = {
      html: {
        'font-size': false
      },
      body: {
        'font-size': false
      }
    };

    const checkStatement = node => {
      if (undefined === node.parent.selector) {
        return;
      }
      try {
        selectorParser(selector => {
          selector.nodes.forEach(selectorNode => {
            const selectorString = selectorNode.toString().trim();
            if (undefined === fontSizeCheck[selectorString]) {
              return;
            }
            if (undefined === fontSizeCheck[selectorString][node.prop]) {
              return;
            }
            if (node.value === `62.5%`) {
              fontSizeCheck[selectorString][node.prop] = true;
            }
          });
        }).process(node.parent.selector);
      } catch (e) {
        console.log(node.parent.selector, `could not be parsed`);
      }
    };

    postcssRoot.walkDecls(checkStatement);

    if (!fontSizeCheck[`html`][`font-size`] && !fontSizeCheck[`body`][`font-size`]) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: postcssRoot,
        message: `set font size to 62.5% on html selector`
      });
    }
  };
});

module.exports = myPluginRule;
module.exports.ruleName = ruleName;
module.exports.messages = messages;
