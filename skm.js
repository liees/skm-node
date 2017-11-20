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

