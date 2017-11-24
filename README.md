ssh keys manager
======

[![npm version](https://badge.fury.io/js/skm-node.svg)](https://badge.fury.io/js/skm-node)

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
