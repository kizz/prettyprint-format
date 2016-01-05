// vim: set ts=2 sts=2 sw=2 et ai:

var util = require("./util");
var Fragment = require("./Fragment");

var baseKlass = Fragment;

function BreakHint(formatter, nspaces, offset, hard) {
  baseKlass.call(this, formatter, "BreakHint");
  this.nspaces = nspaces;
  this.offset = offset;
  this.hard = !!hard;
  this.doBreak_ = false;
  this.parentBox_ = undefined;
}

var klass = BreakHint;
var proto = klass.prototype = Object.create(baseKlass.prototype, { constructor: { value: klass } });

proto.dumpString_ = function () {
  return "HINT(" + this.nspaces + (this.doBreak_ ? "" : "*")
           + "/" + this.offset + (this.doBreak_ ? "*" : "")
           + ")" + (this.hard ? "!" : "");
}

proto.appendedTo = function (box) {
  this.parentBox_ = box;
};

proto.resetFormatData = function () {
  this.doBreak_ = false;
};

proto.setToBreak = function () {
  util.assert(this.parentBox_, "must have the parent box.");
  util.assert(!this.doBreak_, "must not called twice without reset.");
  this.doBreak_ = true;

  this.parentBox_.notifyLineBreak();
};

proto.hasHardBreakHint = function () {
  return this.hard;
};

proto.leftPosAfterPutHorizontally = function (left, limit) {
  return left + this.nspaces;
};

proto.format = function (boxLeft, startColumn) {
  util.assert(this.parentBox_, "BreakHint#format(): must have a parent box.");
  var ppf = this.formatter_;

  if (this.doBreak_) {
    var indent = ppf.clipByMaxIndent_(boxLeft + this.parentBox_.boxIndent() + this.offset);
    ppf.nearestIndent_ = indent;
    return indent;
  } else {
    return startColumn + this.nspaces;
  }
};

proto.print = function (boxLeft, startColumn) {
  util.assert(this.parentBox_, "BreakHint#print(): must have a parent box.");
  var ppf = this.formatter_;
  var printer = ppf.printer();

  if (this.doBreak_) {
    var indent = ppf.clipByMaxIndent_(boxLeft + this.parentBox_.boxIndent() + this.offset);
    printer.outputNewline();
    if (indent > 0)
      printer.outputSpace(indent);
    return indent;
  } else {
    if (this.nspaces > 0)
      printer.outputSpace(this.nspaces);
    return startColumn + this.nspaces;
  }
};

module.exports = klass;

