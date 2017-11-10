#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var program = require('commander');
var PKG = require('./package.json');

var sshPathArr = process.cwd().split('/');
var sshPath = sshPathArr[0] + '/' + sshPathArr[1] + '/' + sshPathArr[2] + '/.ssh/skm/';


program
  .version(PKG.version);


program
  .command('ls');
  .description('List all the ssh key');
  .action(onList);


function onList(){

}

