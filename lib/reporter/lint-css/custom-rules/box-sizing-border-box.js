'use strict';

const stylelint = require('stylelint'),
  selectorParser = require('postcss-selector-parser');
const ruleName = 'devinehowest/box-sizing-border-box';

const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: 'Expected correct border box reset',
});

const myPluginRule = stylelint.createPlugin(ruleName, () => {
  return (postcssRoot, postcssResult) => {

    const boxSizingBorderBoxCheck = {
      '*': {
        'box-sizing': {
          'border-box': false,
          'inherit': false,
        }
      },
      '*::before': {
        'box-sizing': {
          'border-box': false,
          'inherit': false,
        }
      },
      '*::after': {
        'box-sizing': {
          'border-box': false,
          'inherit': false,
        }
      },
      'html': {
        'box-sizing': {
          'border-box': false
        }
      },
      'body': {
        'box-sizing': {
          'border-box': false
        }
      }
    };

    const checkStatement = node => {
      selectorParser(selector => {
        selector.nodes.forEach(selectorNode => {
          const selectorString = selectorNode.toString().trim();
          if(null == boxSizingBorderBoxCheck[selectorString]) {
            return;
          }
          if(null == boxSizingBorderBoxCheck[selectorString][node.prop]) {
            return;
          }
          if(null == boxSizingBorderBoxCheck[selectorString][node.prop][node.value]) {
            return;
          }
          boxSizingBorderBoxCheck[selectorString][node.prop][node.value] = true;
        });
      }).process(node.parent.selector);
    };

    postcssRoot.walkDecls(checkStatement);

    if(!boxSizingBorderBoxCheck['*']['box-sizing']['border-box'] && !boxSizingBorderBoxCheck['*']['box-sizing']['inherit']) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: postcssRoot,
        message: 'set box-sizing to inherit on * selector'
      });
    }
    if(!boxSizingBorderBoxCheck['*::before']['box-sizing']['border-box'] && !boxSizingBorderBoxCheck['*::before']['box-sizing']['inherit']) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: postcssRoot,
        message: 'set box-sizing to inherit on *::before selector'
      });
    }
    if(!boxSizingBorderBoxCheck['*::after']['box-sizing']['border-box'] && !boxSizingBorderBoxCheck['*::after']['box-sizing']['inherit']) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: postcssRoot,
        message: 'set box-sizing to inherit on *::after selector'
      });
    }
    if(!boxSizingBorderBoxCheck['*']['box-sizing']['border-box'] && !boxSizingBorderBoxCheck['html']['box-sizing']['border-box'] && !boxSizingBorderBoxCheck['body']['box-sizing']['border-box']) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: postcssRoot,
        message: 'set box-sizing to border-box on html selector'
      });
    }
  }
})

module.exports = myPluginRule;
module.exports.ruleName = ruleName;
module.exports.messages = messages;