module.exports = Object.assign(
  {},
  require('./fs_utils.js'),
  require('./indent_utils.js'),
  require('./lint_css.js'),
  { phantom: require('./phantom_bridge.js') },
  require('./outline_html.js'),
  require('./validate_loaded_resources.js'),
  require('./validate_html.js')
);
