# SSH keys manager for nodejs
----
[![Build Status](https://travis-ci.org/liees/skm-node.svg?branch=master)](https://travis-ci.org/liees/skm-node)
[![npm version](https://img.shields.io/npm/v/skm-node.svg)](https://badge.fury.io/js/skm-node)
[![downloads](https://img.shields.io/npm/dt/skm-node.svg)](https://www.npmjs.com/package/skm-node)
[![CRAN](https://img.shields.io/badge/license-Do%20What%20the%20Fuck%20You%20Want%20to%20Public%20License-green.svg)](https://github.com/liees/skm-node/blob/master/LICENSE)


#### Before

1. Make sure the `~/.skm` directory does not exist.

2. Please save first to avoid loss if you are currently using sshkey.

#### Installtion

```
$ npm install -g skm-node
```

#### Usage

```
Usage: skm [options] [command]

Options:
  -V, --version     output the version number
  -h, --help        output usage information

Commands:
  init              Initialize skm-node
  ls                List all the ssh key
  use <name>        change the use ssh key
  c <name> <email>  create new ssh key
  help              Print this help
```

#### Example

```
$ skm init

skm-node init successful!
```

```
$ skm ls

    123
 #  default
```

```
$ skm c <email> <name>

$ skm c 123@qq.com 123
Enter passphrase (empty for no passphrase):
Enter same passphrase again:

successful, You can use the 123 ssh key!
```

```
$ skm use <name>

$ skm use 123
Now SSH KEY use the: 123
```

#### Contributing

1. Fork it
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create new Pull Request

#### Licence

this repo is released under the [WTFPL](https://github.com/liees/skm-node/blob/master/LICENSE) – Do What the Fuck You Want to Public License.

