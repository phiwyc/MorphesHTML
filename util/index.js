const fs = require('fs')
const path = require('path')
const global = require('../share/share.js')

// 遍历文件
function findFile (filePath) {
    let files = fs.readdirSync(filePath)
    let rootPath = path.resolve('./')
    //遍历读取到的文件列表
    for (let i = 0; i < files.length; i++) {
        //获取当前文件的绝对路径
        let filedir = path.join(filePath, files[i])
        // 目标路径
        let targetPath = filedir.replace(rootPath + '\\src', rootPath + '\\dist')
        //根据文件路径获取文件信息，返回一个fs.Stats对象
        let stats = fs.statSync(filedir)
        let isFile = stats.isFile() // 是文件
        let isDir = stats.isDirectory() // 是文件夹
        if (isFile) {
            let temp = filedir.split('.')
            if (temp[temp.length - 1] == 'mtml') {
                global.mtmlFileList.push(filedir)
                continue
            }
            // 将该文件复制到dist目录
            copyFile(filedir, targetPath)
        }
        if (isDir) {
            fs.mkdirSync(targetPath)
            findFile(filedir) // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }
    }
}

// 生成DIST
function generateDist () {
    
}

// 复制文件
function copyFile(src, dist) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dist));
}


module.exports = {
    findFile
}