#!/usr/bin/env node

var fs = require('fs')
var sshPathArr = process.cwd().split('/');
var sshPath = sshPathArr[0] + '/' + sshPathArr[1] + '/' + sshPathArr[2] + '/.ssh/';
var exec = require('child_process').exec
var os = require('os')

function onList(){
  fs.readdir(sshPath + 'skm/', 'r', function (err, result) {
    var infos = [];
    for(var i = 0; i < result.length; i++){
      var line = require(sshPath + 'skm/skm.json').use === result[i] ? ' *  ' + result[i] : '    ' + result[i];
      if (result[i] !== 'skm.json'){
        infos.push(line);
      };
    };
    printMsg(infos);
  });
}

function printMsg(infos) {
  infos.forEach(function(info) {
    console.log(info)
  })
}

function onUse(name) {
  fs.readdir(sshPath + '/skm', 'r', function (err, result) {
    if (result.indexOf(name) === -1) {
      printMsg([
        '', '   Not find ssh key : ' + name, ''
      ]);
    } else {
      use(name);
    }
  });
}

function use(name) {
  var a = exec('cp -Rf ' + sshPath + 'skm/' + name + '/* ' + sshPath, function(err, stdout, stderr) {
    if (err) throw err;
    fs.writeFile(sshPath + 'skm/skm.json', '{\"use\":\"}' + name +'\"', function (err, result) {
      printMsg([
        '', '   ssh key has been use: ' + name, ''
      ])
      return;
    })
  });
}

function create(email, name) {
  if(!email && !name) {
    printMsg([email, name,
      '', '   please input email and name!',''
    ]);
  } else {
    fs.readdir(sshPath, 'r', function (err, result) {
      var isExistence = Boolean(result.indexOf(name))
      if (!isExistence) {
        printMsg([
          '', '   The ssh key' + name + 'already exists, please choose another one!',''
        ]);
      } else {
        operation(email, name);
      }
    });
  }
}

function operation(email, name) {
    var a = exec('mkdir ' + sshPath + 'skm/' + name, function(err, stdout, stderr) {
      var b = exec('ssh-keygen -t rsa -C ' + email + ' -f ' + sshPath + 'skm/' + name + '/id_rsa', function(err, stdout, stderr){
        printMsg([
          '', '   create ssh key successful: ' + name + '  email is ' + email, ''
        ]);
      });
  });
  return;
}

function init(){
  fs.writeFile(sshPath + 'skm/skm.json', '{\"use\":\"\"}', function (err, result) {
    return;
  });
}
// init();
// onList();
// create('13665544@qq.com', 'dsafassw');
// onUse('bbb')
console.log(os.homedir())