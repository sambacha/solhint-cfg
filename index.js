'use strict';
var _a = require('prettier-linter-helpers'),
  showInvisibles = _a.showInvisibles,
  generateDifferences = _a.generateDifferences;
var INSERT = generateDifferences.INSERT,
  DELETE = generateDifferences.DELETE,
  REPLACE = generateDifferences.REPLACE;
var getLocFromIndex = function (text, index) {
  var line = 1;
  var column = 0;
  var i = 0;
  while (i < index) {
    if (text[i] === '\n') {
      line++;
      column = 0;
    } else {
      column++;
    }
    i++;
  }
  return { line: line, column: column };
};
var PrettierChecker = /** @class */ (function () {
  function PrettierChecker(reporter, config, inputSrc, fileName) {
    this.prettier = null;
    this.ruleId = 'prettier';
    this.reporter = reporter;
    this.config = config;
    this.inputSrc = inputSrc;
    this.fileName = fileName;
  }
  PrettierChecker.prototype.enterSourceUnit = function () {
    this.SourceUnit();
  };
  PrettierChecker.prototype.SourceUnit = function () {
    var _this = this;
    try {
      // Check for optional dependencies with the try catch
      // Prettier is expensive to load, so only load it if needed.
      if (!this.prettier) {
        this.prettier = require('prettier');
      }
      var filepath = this.fileName;
      var prettierRcOptions = this.prettier.resolveConfig.sync(filepath, {
        editorconfig: true,
      });
      var prettierOptions = Object.assign({}, prettierRcOptions, {
        filepath: filepath,
        plugins: ['prettier-plugin-solidity'],
      });
      var formatted = this.prettier.format(this.inputSrc, prettierOptions);
      var differences = generateDifferences(this.inputSrc, formatted);
      differences.forEach(function (difference) {
        var loc = null;
        switch (difference.operation) {
          case INSERT:
            loc = getLocFromIndex(_this.inputSrc, difference.offset);
            _this.errorAt(loc.line, loc.column, 'Insert ' + showInvisibles(difference.insertText));
            break;
          case DELETE:
            loc = getLocFromIndex(_this.inputSrc, difference.offset);
            _this.errorAt(loc.line, loc.column, 'Delete ' + showInvisibles(difference.deleteText));
            break;
          case REPLACE:
            loc = getLocFromIndex(_this.inputSrc, difference.offset);
            _this.errorAt(
              loc.line,
              loc.column,
              'Replace ' +
                showInvisibles(difference.deleteText) +
                ' with ' +
                showInvisibles(difference.insertText),
            );
            break;
          default:
          // A switch must have a default
        }
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  };
  PrettierChecker.prototype.errorAt = function (line, column, message) {
    this.reporter.errorAt(line, column, this.ruleId, message);
  };
  return PrettierChecker;
})();
module.exports = [PrettierChecker];
