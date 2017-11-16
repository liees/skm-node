#!/usr/bin/env node

var fs = require('fs')

var sshPathArr = process.cwd().split('/')

// console.log(sshPath)

var sshPath = sshPathArr[0] + '/' + sshPathArr[1] + '/' + sshPathArr[2] + '/.ssh/skm/'

function onList(){
  fs.readdir(sshPath, 'r', function (err, result) {
    
    result.forEach(function(info) {
      // info.split('.')
      console.log('    ' + info.split('.')[0]);
  });
  });
}
onList()