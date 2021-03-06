// vim: set ts=2 sts=2 sw=2 et ai si:

var expect = require("chai").expect;
var pp = require("../");

describe("general", function () {

  var savedStatus;

  beforeEach(function () {
    savedStatus = {
      mgn: pp.getMargin(),
      mi: pp.getMaxIndent(),
      smgn: pp.getStrMargin(),
      smi: pp.getStrMaxIndent()
    };
  });

  afterEach(function () {
    pp.setMargin(savedStatus.mgn, savedStatus.mi);
    pp.setStrMargin(savedStatus.smgn, savedStatus.smi);
  });

  it("margin/maxIndent", function () {
    expect(pp.getMargin()).to.equal(pp.DEFAULT_MARGIN);
    expect(pp.getMaxIndent()).to.equal(0);

    pp.setMargin(40);
    expect(pp.getMargin()).to.equal(40);

    pp.setMargin(50, 45);
    expect(pp.getMargin()).to.equal(50);
    expect(pp.getMaxIndent()).to.equal(45);

    pp.setMaxIndent(5);
    expect(pp.getMaxIndent()).to.equal(5);
  });

  it("strMargin/strMaxIndent", function () {
    expect(pp.getStrMargin()).to.equal(pp.DEFAULT_MARGIN);
    expect(pp.getStrMaxIndent()).to.equal(0);

    pp.setStrMargin(40);
    expect(pp.getStrMargin()).to.equal(40);

    pp.setStrMargin(20, 15);
    expect(pp.getStrMargin()).to.equal(20);
    expect(pp.getStrMaxIndent()).to.equal(15);

    pp.setStrMaxIndent(5);
    expect(pp.getStrMaxIndent()).to.equal(5);

    var s = pp.sprintf("@[[foooooo@[[bar@ dee@ luuu@ teee@ buuuuuuu@ miiiii]@]@ puu]@]@?");
    var a =
      "[foooooo[bar dee\n" +
      "     luuu teee\n" +
      "     buuuuuuu\n" +
      "     miiiii]\n" +
      "puu]";
    expect(s).to.equal(a);
  });

  it("setMaxBox/setEllipsisText", function () {
    var ppf = new pp.Formatter({
      maxBoxes: 8
    });
    expect(ppf.getMaxBoxes()).to.equal(8);
    expect(ppf.getEllipsisText()).to.equal(".");

    ppf.setMaxBoxes(4);
    expect(ppf.getMaxBoxes()).to.equal(4);
    expect(ppf.printf("@[111@[222@[333@[444@]3@]2@]1@]")).to.equal("111222.21");

    var called = false;
    var s = ppf.printf("@[111@[222@[333@[444%t@]3@]2@]1@]", function (ppf) {
      called = true;
    });
    expect(s).to.equal("111222.21");
    expect(called).to.equal(true);

    ppf.setMaxBoxes(5);
    ppf.setEllipsisText("(...)");
    expect(ppf.getMaxBoxes()).to.equal(5);
    expect(ppf.getEllipsisText()).to.equal("(...)");
    expect(ppf.printf("@[111@[222@[333@[444@]3@]2@]1@]")).to.equal("111222333(...)321");
  });

  it("prints several times", function () {
    var lastFinished;
    var ppf = new pp.Formatter({
      margin: 20,
      onFinish: function (s) { lastFinished = s; },
      onNewline: function () { return "$"; },
      onSpace: function (n) { return "<" + n + ">"; },
      onString: function (s) { return s.toUpperCase(); },
    });

    var s = ppf.printf("@[<v>foo@ zoo@ vee@ %+10.3f@]@.", 45.2);
    var a = "FOO$ZOO$VEE$   +45.200$";
    expect(s).to.equal(a);
    expect(lastFinished).to.equal(a);

    var s = ppf.printf("@[<h>foo@ zoo@ vee@ %+10.3f@]@.", 45.2);
    var a = "FOO<1>ZOO<1>VEE<1>   +45.200$";
    expect(s).to.equal(a);
    expect(lastFinished).to.equal(a);

    var s = ppf.printf("zoo@[% 10e@\n% 10e@\naa@]@?", 0.045, -30.12);
    var a = "ZOO    4.5E-2$<3> -3.012E+1$<3>AA";
    expect(s).to.equal(a);
    expect(lastFinished).to.equal(a);
  });

  it("treats break hints", function () {
    pp.setStrMargin(20, 19);
    var s = pp.sprintf("@[foo@;bar@]@?");
    var a = "foo bar";
    expect(s).to.equal(a);
  });

  it("bleeds out the margin unless breakable", function () {
    pp.setStrMargin(8);
    var s = pp.sprintf("@[<hov 4><123456789@ @[<hov 4><123456789@ @[<hov 4><123456789>@]>@]>@]");
    var a = "<123456789\n"
          + "    <123456789\n"
          + "        <123456789>>>";
    expect(s).to.equal(a);
  });

  it("regression: can be specieid width for %s", function () {
    expect(pp.sprintf("AA%10sBB", "foo")).to.equal("AA       fooBB");
    expect(pp.sprintf("AA%-10sBB", "foo")).to.equal("AAfoo       BB");
    expect(pp.sprintf("AA%- +10sBB", "foo")).to.equal("AAfoo       BB");
    expect(pp.sprintf("AA%2sBB", "foo")).to.equal("AAfooBB");
    expect(pp.sprintf("AA%-2sBB", "foo")).to.equal("AAfooBB");

    expect(pp.sprintf("AA%10BZZ", true)).to.equal("AAtrueZZ");
    expect(pp.sprintf("AA%-10BZZ", false)).to.equal("AAfalseZZ");
    expect(pp.sprintf("AA%10tZZ", function (ppf) { ppf.printf("s") })).to.equal("AAsZZ");
  });

  it("%*.*f", function () {
    expect(pp.sprintf("AA%*sBB", 10, "foo")).to.equal("AA       fooBB");
    expect(pp.sprintf("AA%-*dBB", 10, 30)).to.equal("AA30        BB");
    expect(pp.sprintf("AA%.*fBB", 2, 42.12345)).to.equal("AA42.12BB");
    expect(pp.sprintf("AA%+10.*fBB", 2, 42.12345)).to.equal("AA    +42.12BB");
    expect(pp.sprintf("AA%+*.*fBB", 8, 2, 42.12345)).to.equal("AA  +42.12BB");
    expect(pp.sprintf("AA% .*fBB", 3, 42.12345)).to.equal("AA 42.123BB");
  });

  it("sensitive hvbox", function () {
    var target = "@[<hv>[@;<0 2>@[<shv>"
               +   "@[<hv>[@;<0 2>@[<shv>3,@ fooo@]@,]@]"
               + ",@ 'ss'@]@,]@]";
    pp.setStrMargin(18);
    var formatted = pp.sprintf(target);
    var expected_noBreak = [
      "[[3, fooo], 'ss']"
    ].join("\n");
    expect(formatted).equal(expected_noBreak);

    pp.setStrMargin(17);
    var formatted = pp.sprintf(target);
    var expected_breakInner = [
      "[",
      "  [3, fooo],",
      "  'ss'",
      "]"
    ].join("\n");
    expect(formatted).equal(expected_breakInner);

    pp.setStrMargin(12);
    var formatted = pp.sprintf(target);
    expect(formatted).equal(expected_breakInner);

    pp.setStrMargin(11);
    var formatted = pp.sprintf(target);
    var expected_fullBreak = [
      "[",
      "  [",
      "    3,",
      "    fooo",
      "  ],",  // 'ss' is not here because of sensitive hvbox
      "  'ss'",
      "]"
    ].join("\n");
    expect(formatted).equal(expected_fullBreak);

    pp.setStrMargin(5);
    var formatted = pp.sprintf(target);
    expect(formatted).equal(expected_fullBreak);
  });

  it("finishPrint()", function () {
    var ppf = new pp.Formatter({ margin: 20 });
    ppf.openHvbox(1);
    ppf.printf("%e", 10.3);
    ppf.printSpace();
    ppf.printString("+");
    ppf.printSpace();
    ppf.printf("%d", 15);
    ppf.closeBox();
    var result = ppf.finishPrint();
    expect(result).to.equal("1.03e+1 + 15");

    ppf.setMargin(5);
    ppf.openHvbox(1);
    ppf.printf("%e", 10.3);
    ppf.printSpace();
    ppf.printString("+");
    ppf.printSpace();
    ppf.printf("%d", 15);
    ppf.closeBox();
    var result = ppf.finishPrint();
    expect(result).to.equal([
      "1.03e+1",
      " +",
      " 15"
    ].join("\n"));
  });
});
