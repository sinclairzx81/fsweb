"use strict";

const task = require("./tasksmith.js")

//------------------------------------
// cleans out the bin
//------------------------------------
const clean = () => task.drop("./bin")

//------------------------------------
// builds the bin
//------------------------------------
const build = () => task.series(() => [
  task.shell("tsc test/index.ts --module commonjs --target es5 --removeComments --outDir ./bin"),
  task.copy ("./src/fsweb",    "./bin"),
  task.copy ("./package.json", "./bin"),
  task.copy ("./readme.md",    "./bin"),
  task.copy ("./license",      "./bin")
])

//------------------------------------
// runs tests
//------------------------------------
const test = () => task.series(() => [
  task.shell("node bin/test/index.js")
])

//------------------------------------
// installs module.
//------------------------------------
const install = () => task.series(() => [
  task.shell("cd ./bin && npm install -g .")
])

//------------------------------------
// uninstalls module.
//------------------------------------
const uninstall = () => task.series(() => [
  task.shell("cd ./bin && npm uninstall -g .")
])

//------------------------------------
// publishes this module.
//------------------------------------
const publish = () => task.series(() => [
  task.shell("cd ./bin && npm publish")
])

const cli = task.cli(process.argv, {
  "clean"     : clean(),
  "build"     : build(),
  "test"      : test(),
  "install"   : install(),
  "uninstall" : uninstall(),
  "publish"   : publish()
})

task.debug(cli)