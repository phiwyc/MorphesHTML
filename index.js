// 导入文件模块
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const chokidar = require('chokidar')
// 导入全局变量
let global = require('./share/share')
// 导入编译与工具模块
const util = require('./util/index')
const compiler = require('./core/index')

// 入口
console.log('MorphesHTML Compiler is watching...')
// 启动时自动编译一次
rimraf(path.resolve('./dist'), (err) => {
    if (err) {console.log(err);return}
    fs.mkdirSync(path.resolve('./dist'))
    util.findFile(path.resolve(global.SRC_PATH))
    compiler.compiler(global.mtmlFileList)
})
// 监听文件变化后编译
chokidar.watch('./src').on('change', (paths, stats) => {
    if (global.isCompiling) {
        return
    }
    // 通过延时避免一些潜在的文件系统问题
    // FIXME: rimraf偶尔会报权限问题，需要调查原因
    global.isCompiling = true
    // 每次编译时删除Dist
    rimraf(path.resolve('./dist'), (err) => {
        if (err) {console.log(err);return}
        // 然后重新生成Dist
        fs.mkdirSync(path.resolve('./dist'))
        // 遍历文件
        util.findFile(path.resolve(global.SRC_PATH))
        // 开始编译
        compiler.compiler(global.mtmlFileList)
    })
})

// TODO: 组件化
