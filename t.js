#!/usr/bin/env node

var fs = require('fs')

var sshPathArr = process.cwd().split('/')

console.log(sshPath)

var sshPath = sshPathArr[0] + '/' + sshPathArr[1] + '/' + sshPathArr[2] + '/.ssh/skm/'

fs.readdir(sshPath, function(err, files) {
  console.log(err)
  console.log(files)
})