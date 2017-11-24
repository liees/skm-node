## ssh keys manager

[![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/skm-node)
[![npm](https://img.shields.io/npm/dt/express.svg)](https://www.npmjs.com/package/skm-node)

----

SSH keys manager for nodejs

本工具安装目录：`~/.skm`

注意：
1. 安装之前请确认`~/.skm` 目录不存在
2. 如果已经有sshkey在使用，使用本工具前请备份，避免丢失


#### Install
```
npm install -g
```

#### Init
```
skm init
```

#### list
```
skm ls
```

#### create new ssh key
```
skm create <email> <name> 
```

#### use
```
skm use <name>
```


### Licence

this repo is released under the WTFPL – Do What the Fuck You Want to Public License.
