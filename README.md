ssh keys manager
======

[![npm version](https://badge.fury.io/js/skm-node.svg)](https://badge.fury.io/js/skm-node)
[![CRAN](https://img.shields.io/badge/listencce-DO%20WHAT%20THE%20FUCK%20YOU%20WANT%20TO%20PUBLIC%20LICENSE-green.svg)](https://github.com/liees/skm-node/blob/master/LICENSE)

SSH keys manager for nodejs
----

installation manual: `~/.skm`

note: 
1. Please confirm before installation the `~/.skm` does not exist
2. If you already have ssh key in use, please backup before use to avoid loss


#### Install

```
npm install -g skm-node
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
