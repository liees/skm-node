ssh keys manager
======

[![npm version](https://badge.fury.io/js/skm-node.svg)](https://badge.fury.io/js/skm-node)
[![CRAN](https://img.shields.io/badge/license-Do%20What%20the%20Fuck%20You%20Want%20to%20Public%20License-green.svg)](https://github.com/liees/skm-node/blob/master/LICENSE)

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


## Contributing

1. Fork it
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create new Pull Request

## Licence

this repo is released under the [WTFPL](https://github.com/liees/inspection_area/blob/master/LICENSE) – Do What the Fuck You Want to Public License.


