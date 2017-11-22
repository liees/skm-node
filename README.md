# skm

----

SSH keys manager for nodejs

本工具安装目录：`~/.skm`

注意：
1. 安装之前请确认`~/.skm` 目录不存在
2. 如果已经有sshkey在使用，使用本工具前请备份然后替换你为使用本工具创建的skm。


- 安装
```
npm install -g
```
- 初始化
```
skm init
```
- 列表
```
skm ls
```
- 创建
```
skm create <email> <name> 
```
- 使用
```
skm use <name>
```