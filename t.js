#!/usr/bin/env node
const Promise = require('bluebird');
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

// program
//   .command('ls')
//   .description('List all the ssh key')
//   .action(onList)

// program
//   .command('use <name>')
//   .description('change the use ssh key')
//   .action(onUse)

// program
//   .command('create <email> <name>')
//   .description('create new ssh key')
//   .action(create)

// program
//   .command('help')
//   .description('Print this help')
//   .action(function () {
//     console.log('help~')
//     program.outputHelp();
//   });

// function onList(){
//   fs.readdir(sshPath + 'skm/', 'r', function (err, result) {
//     let infos = [];
//     for(let i = 0; i < result.length; i++){
//       let line = require(sshPath + 'skm/skm.json').use === result[i] ? ' *  ' + result[i] : '    ' + result[i];
//       if (result[i] !== 'skm.json'){
//         infos.push(line);
//       };
//     };
//     printMsg(infos);
//   });
// }

// function printMsg(infos) {
//   infos.forEach(function(info) {
//     console.log(info)
//   })
// }

// function onUse(name) {
//   fs.readdir(sshPath + '/skm', 'r', function (err, result) {
//     if (result.indexOf(name) === -1) {
//       printMsg([
//         '', '   Not find ssh key : ' + name, ''
//       ]);
//     } else {
//       let a = exec('cp -Rf ' + sshPath + 'skm/' + name + '/* ' + sshPath, function(err, stdout, stderr) {
//         if (err) throw err;
//         fs.writeFile(sshPath + 'skm/skm.json', '{\"use\":\"}' + name +'\"', function (err, result) {
//           printMsg([
//             '', '   ssh key has been use: ' + name, ''
//           ])
//           return;
//         })
//       });
//     }
//   });
// }

// function create(email, name) {
//   if(!email && !name) {
//     printMsg([email, name,
//       '', '   please input email and name!',''
//     ]);
//   } else {
//     fs.readdir(sshPath, 'r', function (err, result) {
//       let isExistence = Boolean(result.indexOf(name))
//       if (!isExistence) {
//         printMsg([
//           '', '   The ssh key' + name + 'already exists, please choose another one!',''
//         ]);
//       } else {
//         let a = exec('mkdir ' + sshPath + 'skm/' + name, function(err, stdout, stderr) {
//           let b = exec('ssh-keygen -t rsa -C ' + email + ' -f ' + sshPath + 'skm/' + name + '/id_rsa', function(err, stdout, stderr){
//             printMsg([
//               '', '   create ssh key successful: ' + name + '  email is ' + email, ''
//             ]);
//           });
//         });
//         return;
//       }
//     });
//   }
// }

function init(){
  let mkdirskm = fs.mkdirSync(skmPath);
  let writeskm = fs.writeFileSync(skmPath + '/config.json', '{\"use\":\"\"}');
  return;
}

init()