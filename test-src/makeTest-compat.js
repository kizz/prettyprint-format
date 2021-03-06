// vim: set ts=2 sts=2 sw=2 et ai:

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var ECT = require("ect");
var program = require("commander");

program
  .option("-o, --output <filename>", "Specify the output file.")
  .option("-i, --input <filename>", "Specify the test data set.")
  .parse(process.argv);

var dataFilePath = program.input;
var outFilePath = program.output;

if (!dataFilePath) {
  console.log("Error: no input file.");
  process.exit(1);
}
if (!outFilePath) {
  console.log("Error: no output file specified.");
  process.exit(1);
}

function makeAnswer(m, s) {
  s = s.replace(/\n/g, "\\n").replace(/\\/g, "\\\\\\")
       .replace(/([<>;])/g, function (m) { return "\\" + m; });
  var cmd = "echo open Format\\;\\; "
          +      "set_margin " + m + "\\;\\; "
          +      "set_max_indent " + (m - 1) + "\\;\\; " // it is implicitly modified by set_margin.
          +      "printf \\\"" + s + "\\\" | "
          + "ocaml -stdin";
  var result = child_process.execSync(cmd).toString();
  return result;
}

var renderer = ECT({ root: __dirname });
var content = fs.readFileSync(dataFilePath, "utf8");

var testCases = [];

JSON.parse(content).forEach(function (t) {
  var margins = (typeof t.margin === "number") ? [t.margin] : t.margin;
  var src = JSON.stringify(t.source);
  margins.forEach(function (m) {
    var ans = makeAnswer(m, t.source);
    testCases.push({
      name: JSON.stringify((t.name ? (t.name + ":") : "") + (m + "/" + src)),
      comment: t.comment,
      margin: m,
      source: src,
      expected: JSON.stringify(ans),
      rawExpected: ans,
    });
  });
});

var generated = renderer.render("template-compat.ect", { testCases: testCases });
fs.writeFileSync(outFilePath, generated, "utf8");
console.log("Done!");

