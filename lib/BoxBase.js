// vim: set ts=2 sts=2 sw=2 et ai:

var util = require("./util");
var Fragment = require("./Fragment");

var BoxBase = (function () {
  var baseKlass = Fragment;
  var klass = BoxBase;

  function BoxBase(formatter, additionalIndent, sensitive) {
    additionalIndent || (additionalIndent = 0);
    baseKlass.call(this, formatter, "Box");

    this.additionalIndent_ = additionalIndent;
    this.sensitive_ = !!sensitive;

    this.formatData_ = {
      hasLineBreak: false,
      hasSensitiveLineBreak: false
    };

    this.parentBox_ = undefined;
    this.nearestIndent_ = 0;
    this.buf_ = [];
    this.hints_ = [];
  }

  var proto = klass.prototype = Object.create(baseKlass.prototype, {
    constructor: { value: klass }
  });

  proto.boxIndent = function () {
    return this.additionalIndent_;
  };

  proto.setToBreak = function () {
    // nothing to do.
  };

  proto.appendedTo = function (box) {
    this.parentBox_ = box;
  };

  proto.append = function (frag) {
    this.buf_.push(frag);
    if (frag.kind === "BreakHint")
      this.hints_.push(frag);
    frag.appendedTo(this);
  };

  proto.clear = function () {
    this.parentBox_ = undefined;
    this.nearestIndent_ = 0;
    this.buf_ = [];
    this.hints_ = [];
    this.resetFormatData();
  };

  proto.resetFormatData = function () {
    this.formatData_ = {
      hasLineBreak: false,
      hasSensitiveLineBreak: false
    };
    this.buf_.forEach(function (c) { c.resetFormatData(); });
  };

  proto.leftPosAfterPutHorizontally = function (left, limit) {
    for (var i = 0, len = this.buf_.length; i < len; ++i) {
      var frag = this.buf_[i];
      left = frag.leftPosAfterPutHorizontally(left, limit);
      if (left > limit)
        return left;
    }
    return left;
  };

  proto.hasHardBreakHint = function () {
    // TODO should cache the partial result on added
    return util.indexOf(this.buf_, function (frag) {
      return frag.hasHardBreakHint();
    }) != -1;
  };

  proto.notifyLineBreak = function () {
    if (this.formatData_.hasLineBreak)
      return;
    this.formatData_.hasLineBreak = true;
    if (this.sensitive_)
      this.formatData_.hasSensitiveLineBreak = true;
    if (this.parentBox_)
      this.parentBox_.notifyLineBreak();
  };

  proto.format = function (boxLeft, startColumn) {
    throw new Error("PureVirtual: BoxBase#format");
  };

  proto.print = function (boxLeft, startColumn) {
    var printer = this.formatter_.printer();
    printer.outputDebugString("<");
    var ret = this.print_(boxLeft, startColumn);
    printer.outputDebugString(">");
    return ret;
  };

  proto.print_ = function (boxLeft, startColumn) {
    var left = startColumn;
    for (var i = 0, len = this.buf_.length; i < len; ++i)
      left = this.buf_[i].print(startColumn, left);
    return left;
  };

  proto.dumpString_ = function () {
    return this.constructor.name + "(" + (this.leftPosAfterPutHorizontally(0, NaN)) + ")";
  };

  proto.debugDump_ = function (indentDepth) {
    var indent = util.spacer(indentDepth);
    var childrenDump = this.buf_.map(function (c) { return c.debugDump_(indentDepth + 2); });
    return (indent + this.dumpString_()) + "\n" + childrenDump.join("\n");
  };

  return klass;
})();

module.exports = BoxBase;

