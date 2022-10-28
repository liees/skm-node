#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const shelljs = require('shelljs');
const exec = require('child_process').exec
const program = require('commander');
const package = require('./package.json');

const homedir = os.homedir();
const sshPath = path.join(homedir, '.ssh');
const skmPath = path.join(homedir, '.skm');

program
  .name('skm-node')
  .description('SSH keys manager for nodejs')
  .version(package.version)

program
  .command('init')
  .description('Initialize skm-node, if the machine already has ssh key and add it to skm-node, by default')
  .action(init)

program
  .command('ls')
  .description('List all the ssh key')
  .action(onList)

program
  .command('use <name>')
  .description('change the use ssh key')
  .action(onUse)

program
  .command('c <email> <name>')
  .description('create new ssh key')
  .action(create)

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


function init() {
  const is_skm = fs.existsSync(skmPath)
  const is_skm_config = fs.existsSync(path.join(skmPath, '/config.json'))
  if (is_skm) {
    if (!is_skm_config) {
      fs.writeFileSync(skmPath + '/config.json', '{\"use\":\"\"}');
    } else {
      return printMsg(['', 'skm-node is already init, you can try create or use it!'])
    }
  } else {
    fs.mkdirSync(skmPath);
    fs.writeFileSync(skmPath + '/config.json', '{\"use\":\"\"}');
  }
  return printMsg([
    '', 'skm-node init successful!'
  ]);
}

function onList() {
  let dirArr = fs.readdirSync(skmPath);
  let infos = [];
  for (let i = 0; i < dirArr.length; i++) {
    let line = require(skmPath + '/config.json').use === dirArr[i] ? ' =>  \n ' + dirArr[i] : '     ' + dirArr[i];
    if (dirArr[i] !== 'config.json') {
      infos.push(line);
    }
  }
  if (infos.length < 1) {
    printMsg([
      '', ' No ssh-key managed by skm-node!'
    ]);
  }
  printMsg(infos);
}

function create(email, name) {
  if (!email && !name) {
    printMsg([
      '', ' please input name and email!', ''
    ]);
  } else {
    let dirArr = fs.readdirSync(skmPath);
    if (dirArr.indexOf(name) !== -1) {
      printMsg([
        '', '   The ssh key: ' + name + ' is already exists, please choose another one!', ''
      ]);
    } else {
      shelljs.mkdir(skmPath + '/' + name);
      exec('ssh-keygen -t rsa -C ' + email + ' -f ' + skmPath + '/' + name + '/id_rsa', function (err, stdout, stderr) {
        if (err) {
          printMsg([
            '', '  Error! Please try again!', ''
          ]);
        } else {
          printMsg([
            '', ' successful, You can use the ' + name + ' ssh key!', ''
          ]);
        }
      });
    }
  }
}

function onUse(name) {
  let dirArr = fs.readdirSync(skmPath);
  if (dirArr.indexOf(name) === -1) {
    printMsg([
      '', ' Not find ssh key : ' + name + '  in skm-node', ''
    ]);
  } else {
    shelljs.cp('-Rf', skmPath + '/' + name + '/*', sshPath + '/');
    let updateConfig = fs.writeFileSync(skmPath + '/config.json', '{\"use\":\"' + name + '\"}');
    printMsg([
      '', ' Now SSH KEY use the: ' + name + '', ''
    ]);
  }
}


function printMsg(infos) {
  infos.forEach(function (info) {
    console.log(info);
  });
}
