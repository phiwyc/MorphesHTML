// 导入文件模块
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
// 导入全局变量
let global = require('./share/share')
// 导入编译与工具模块
const util = require('./util/index')
const compiler = require('./core/index')

// 入口
// 每次编译时删除Dist
rimraf.sync(path.resolve('./dist'))
// 然后重新生成Dist
fs.mkdirSync(path.resolve('./dist'))
// 遍历文件
util.findFile(path.resolve(global.SRC_PATH))
// 开始编译
compiler.compiler(global.mtmlFileList)
// console.log(global.mtmlFileList)