var indentCharacter = "  ";

var generateIndent = function(indentLevel) {
  var indent = "";
  for(var i = 0; i < indentLevel; i++) {
    indent += indentCharacter;
  }
  return indent;
};

module.exports = {
  generateIndent: generateIndent
};
