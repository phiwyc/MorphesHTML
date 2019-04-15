// MTML核心
const fs = require('fs')
const path = require('path')
// 引入JSDOM来方便地生成DOM树
const jsdom = require('jsdom')
const { JSDOM } = jsdom
// 导入全局变量
let global = require('../share/share.js')

// 编译入口
function compiler (mtmlList) {
    // 根据文件列表进行解析
    mtmlList.forEach(mtml => {
        console.log('Compiling...' + mtml)
        let rootPath = path.resolve('./')
        let source = fs.readFileSync(mtml).toString()
        // 初始化
        initGlobal()
        // 初始DOM树
        let domTree = new JSDOM('<!DOCTYPE html><html></html>')
        // 处理代码字符流
        for (let i = 0; i < source.length; i++) {
            global.sourceArr.push(source[i])
            checkToken()
        }
        // HTML 转换处理
        transToHTML(global.mtmlTree, domTree)
        let allDom = domTree.window.document.getElementsByTagName('*')
        for (let i = 0; i < allDom.length; i++){
            allDom[i].removeAttribute('morphes-id')
        }
        // 将文件导出至DIST目录
        let tempStrArr = mtml.split('')
        tempStrArr[tempStrArr.length - 4] = 'h'
        mtml = tempStrArr.join('')
        fs.writeFileSync(mtml.replace(rootPath + '\\src', rootPath + '\\dist'), domTree.window.document.documentElement.outerHTML)
    })
    console.log('Compile success.')
}

// 逐行读取token
function checkToken () {
    if(global.sourceArr.indexOf('\n') >= 0){
        for (let i = 0; i < global.sourceArr.length; i++) {
            global.tempToken.push(global.sourceArr[i])
            if ( global.sourceArr[i] == '\n') {
                setToken()
            }
        }
        global.sourceArr = []
    }
}

// 构造词法树
function setToken() {
    let pt = global.tempToken.join('').replace('\n', '').replace('\r', '')
    let k = 0
    let type = ''
    // 检查空格数量
    for (let i = 0; i < pt.length; i++) {
        if (pt[i] == ' ') {
            k++
        }
        if (pt[i] !== ' ') {
            break
        }
    }
    // 检查空格
    let weight = k / 2
    if (k % 2 != 0) {
        throw 'Lexcial Error! Space number must be even!'
    }
    // 去头空格
    pt = pt.substring(k)
    // 类型判断
    type = getType(pt)
    global.nodeCount++
    // 权重判断，用于区分父子类
    if (!global.weightTree['w' + weight]) {
        global.weightTree['w' + weight] = []
    }
    // 修改权重树
    global.weightTree['w' + weight].push(global.nodeCount)
    // dom类添加到列表中记录，用于JSDOM处理
    global.nodeId++
    if (weight == 0) {
        global.mtmlTree[global.NODE + global.nodeCount] = {
            id: global.nodeId,
            name: pt,
            type: 'dom',
            weight
        }
    } else {
        // 根据权重树寻找父级
        let newNode
        if (type == 'string') {
            newNode = {
                id: global.nodeId,
                type: 'string',
                content: pt.replace(/\'/g, ''),
                weight
            }
        } else if (type == 'attr') {
            let attrStr = pt.replace('(', '')
            attrStr = attrStr.replace(')', '')
            let splitPos = attrStr.indexOf(':')
            let attrKey = attrStr.substring(0, splitPos)
            let attrValue = attrStr.substring(splitPos + 1)
            if (attrValue[0] == ' ') {
                attrValue = attrValue.substring(1)
            }
            newNode = {
                id: global.nodeId,
                key: attrKey,
                value: attrValue,
                type: 'attr',
                weight
            }
        } else {
            newNode = {
                id: global.nodeId,
                name: pt,
                type: 'dom',
                weight
            }
        }
        for(let p = 0; p < global.weightTree['w' + (weight -1)].length; p++) {
            if (global.nodeCount < global.weightTree['w' + (weight - 1)][p]) {
                addNode(global.mtmlTree, global.NODE + global.weightTree['w' + (weight -1)][p - 1], global.NODE + global.nodeCount, newNode, type)
                break
            }
            if (p == global.weightTree['w' + (weight -1)].length - 1) {
                addNode(global.mtmlTree, global.NODE + global.weightTree['w' + (weight -1)][p], global.NODE + global.nodeCount, newNode, type)
                break
            }
        }
    }
    global.tempToken = []
}

// 添加节点的方法
function addNode(fatherNode, fatherNodeName, newNodeName, newNode, type) {
    for (let n in fatherNode) {
        if (typeof (fatherNode[n]) == 'object') {
            if(n == fatherNodeName) {
                fatherNode[n][newNodeName] = newNode
                // switch(type){
                //     case 'attr':
                //         fatherNode[n][newNodeName] = newNode
                //     break
                //     default:
                //         fatherNode[n][newNodeName] = newNode
                //     break
                // }
            }else{
                addNode(fatherNode[n], fatherNodeName, newNodeName, newNode, type)
            }
        }
    }
}

// 获得DOM的类型
// 在这里也会有类型检查
function getType (token) {
    if (token[0] == '\'') {
        return 'string'
    }
    if (token[0] == '(') {
        if (token.indexOf(':') > 0) {
            return 'attr'
        }
        throw 'Attribute should be KV format'
    }
    if (token[0] == ')') {
        throw 'Attribute should start with "("'
    }
}

// 转换为HTML
function transToHTML (CST, domTree) {
    for (let n in CST) {
        // 对象即节点
        if ( typeof (CST[n]) == 'object' ) {
            // DOM节点
            if (CST[n].type == 'dom') {
                // 判断权重，父级元素按照遍历顺序直接写入
                if (CST[n].weight == 0) {
                    // 根元素会由JSDOM自动生成，做简单处理即可
                    if (CST[n].name == 'head') {
                        domTree.window.document.head.setAttribute('morphes-id', CST[n].id)
                    } 
                    if (CST[n].name == 'body') {
                        domTree.window.document.body.setAttribute('morphes-id', CST[n].id)
                    }
                } else {
                    // 子元素写在父元素内部
                    // 通过遍历进行添加
                    let newDom =  domTree.window.document.createElement(CST[n].name)
                    let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                    newDom.setAttribute('morphes-id',CST[n].id);
                    let fatherNode = getNode(fatherId, domTree)
                    fatherNode.appendChild(newDom)
                }
                // // 填充属性
                // if (CST[n].attr) {

                // } else {

                // }
                transToHTML(CST[n], domTree)
            } else if (CST[n].type == 'string') {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId, domTree)
                let htmlOfDom = fatherNode.innerHTML
                htmlOfDom += CST[n].content
                fatherNode.innerHTML = htmlOfDom
            } else if (CST[n].type == 'attr') {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId, domTree)
                fatherNode.setAttribute(CST[n].key, CST[n].value)
            }
        }
    }
}

// 获得父元素
function getFatherNodeId(nodeId, weight){
    for(let p = 0; p < global.weightTree['w' + (weight -1)].length; p++) {
        if (nodeId < global.weightTree['w' + (weight - 1)][p]) {
            return global.weightTree['w' + (weight - 1)][p - 1]
        }
        if (p == global.weightTree['w' + (weight -1)].length - 1) {
            return global.weightTree['w' + (weight - 1)][p]
        }
    }
}

// 获得父节点
function getNode (nodeId, domTree) {
    let allNode = domTree.window.document.getElementsByTagName('*')
    for (let i = 0; i < allNode.length; i++) {
        if (allNode[i].getAttribute('morphes-id') == nodeId) {
            return allNode[i]
        }
    }
    throw 'Somthing wrong...'
}

// 初始化全局变量
function initGlobal () {
    global.mtmlTree = {}
    global.nodeCount = 0
    global.nodeId = 0
    global.sourceArr = []
    global.weightTree = {}
}

module.exports = {
    compiler
}