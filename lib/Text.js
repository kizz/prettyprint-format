// vim: set ts=2 sts=2 sw=2 et ai:

var util = require("./util");
var Fragment = require("./Fragment");

var baseKlass = Fragment;

function Text(formatter, content) {
  baseKlass.call(this, formatter, "Text");
  this.content = content;
}

var klass = Text;
var proto = klass.prototype = Object.create(baseKlass.prototype, { constructor: { value: klass } });

proto.dumpString_ = function () {
  return "TEXT(" + this.content.length + "): " + this.content;
}

proto.appendedTo = function (box) {
  // nothing to do.
};

proto.resetFormatData = function () {
  // nothing to do.
};

proto.setToBreak = function () {
  // nothing to do.
};

proto.hasHardBreakHint = function () {
  return false;
};

proto.leftPosAfterPutHorizontally = function (left, limit) {
  return left + this.content.length;
};

proto.format = function (boxLeft, startColumn) {
  return startColumn + this.content.length;
};

proto.print = function (boxLeft, startColumn) {
  this.formatter_.printer().outputString(this.content);
  return startColumn + this.content.length;
};

module.exports = klass;

