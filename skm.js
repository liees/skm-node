#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const shelljs = require('shelljs');
const program = require('commander');
const package = require('./package.json');

const homedir = os.homedir();
const sshPath = path.join(homedir, '.ssh');
const skmPath = path.join(homedir, '.skm');

program
  .version(package.version)

program
  .command('init')
  .description('Initialize skm-node')
  .action(init)

program
  .command('help')
  .description('Print this help')
  .action(function () {
      program.outputHelp();
  });

program
  .parse(process.argv);

if (process.argv.length === 2) {
  program.outputHelp();
}


function init(){
  let mkdirskm = fs.mkdirSync(skmPath);
  let writeskm = fs.writeFileSync(skmPath + '/config.json', '{\"use\":\"\"}');
  return;
}