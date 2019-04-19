// MTML核心
const fs = require('fs')
const path = require('path')
const process = require('process')
// 引入JSDOM来方便地生成DOM树
const jsdom = require('jsdom')
const { JSDOM } = jsdom
// 导入全局变量
let global = require('../share/share.js')

// 编译入口
function compiler (mtmlList) {
    // 根据文件列表进行解析
    mtmlList.forEach(mtml => {
        // 控制台输出
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
            checkToken(i, source.length)
        }
        // HTML 转换处理
        transToHTML(global.mtmlTree, domTree)
        let allDom = domTree.window.document.getElementsByTagName('*')
        for (let i = 0; i < allDom.length; i++) {
            allDom[i].removeAttribute(global.MORPHES_ID)
        }
        // 将文件导出至DIST目录
        let tempStrArr = mtml.split('')
        tempStrArr[tempStrArr.length - 4] = 'h'
        mtml = tempStrArr.join('')
        fs.writeFileSync(mtml.replace(rootPath + '\\src', rootPath + '\\dist'), domTree.window.document.documentElement.outerHTML)
    })
    global.mtmlFileList = []
    global.isCompiling = false
    console.log('Compile success at time ' + new Date())
}

// 逐行读取token
function checkToken (k, srcLength) {
    // 文本最后一个字符的处理问题
    if (k == srcLength - 1) {
        for (let i = 0; i < global.sourceArr.length; i++) {
            global.tempToken.push(global.sourceArr[i])
            if ( i == global.sourceArr.length - 1) {
                setToken(false)
            }
        }
        global.sourceArr = []
    } else {
        // 需要对内嵌JS代码和CSS代码进行处理
        // 换行符是分界
        if(global.sourceArr.indexOf('\n') >= 0){
            for (let i = 0; i < global.sourceArr.length; i++) {
                global.tempToken.push(global.sourceArr[i])
                    if ( global.sourceArr[i] == '\n') {
                        setToken(false)
                    }
            }
            global.sourceArr = []
        }
    }
}

// 构造词法树
function setToken() {
    let pt
    pt = global.tempToken.join('').replace('\n', '').replace('\r', '')
    let k = 0
    let type = ''
    let firstChar = getFirstNonSpaceChar(pt)
    // 检查文段首字符
    if (firstChar == '{') {
        global.scriptTree.switch = true
    }
    if (pt.match(global.SCRIPT_EXP)) {
        // 确保内嵌代码格式正确
        // TODO: 异常处理
        if (checkScriptBrackets(pt)) {
            global.scriptTree.switch = false
        }
    }
    if (global.scriptTree.switch) {
        return
    }
    // console.log(pt)
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
        if (type == global.TOKEN.COMMENT) {
            newNode = {
                id: global.nodeId,
                type: global.TOKEN.COMMENT,
                comment: pt,
                weight
            }
        } else {
            global.mtmlTree[global.NODE + global.nodeCount] = {
                id: global.nodeId,
                name: pt,
                type: global.TOKEN.DOM,
                weight
            }
        }
    } else {
        // 根据权重树寻找父级
        let newNode
        if (type == global.TOKEN.STRING) {
            newNode = {
                id: global.nodeId,
                type: global.TOKEN.STRING,
                content: pt.replace(/\'/g, ''),
                weight
            }
        } else if (type == global.TOKEN.COMMENT) {
            newNode = {
                id: global.nodeId,
                type: global.TOKEN.COMMENT,
                comment: pt,
                weight
            }
        } else if (type == global.TOKEN.ATTR) {
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
                type: global.TOKEN.ATTR,
                weight
            }
        } else if (type == global.TOKEN.SCRIPT) {
            newNode = {
                id: global.nodeId,
                script: pt,
                type: global.TOKEN.SCRIPT,
                weight
            }
        } else {
            newNode = {
                id: global.nodeId,
                name: pt,
                type: global.TOKEN.DOM,
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
        return global.TOKEN.STRING
    }
    if (token[0] == '/' && token[1] == '/') {
        return global.TOKEN.COMMENT
    }
    if (token[0] == '(') {
        if (token.indexOf(':') > 0) {
            return global.TOKEN.ATTR
        }
        throw 'Attribute should be KV format'
    }
    if (token[0] == '{') {
        return global.TOKEN.SCRIPT
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
            if (CST[n].type == global.TOKEN.DOM) {
                // 判断权重，父级元素按照遍历顺序直接写入
                if (CST[n].weight == 0) {
                    // 根元素会由JSDOM自动生成，做简单处理即可
                    // 根元素必须是head或body
                    if (CST[n].name == 'head') {
                        domTree.window.document.head.setAttribute(global.MORPHES_ID, CST[n].id)
                    } 
                    if (CST[n].name == 'body') {
                        domTree.window.document.body.setAttribute(global.MORPHES_ID, CST[n].id)
                    }
                } else {
                    // 子元素写在父元素内部
                    // 通过遍历进行添加
                    // 映射DOM类型
                    let newDom = domTree.window.document.createElement(CST[n].name)
                    if (CST[n].name.indexOf('inline-') == 0) {
                        CST[n].name = CST[n].name.substring(7)
                        newDom = domTree.window.document.createElement(CST[n].name)
                        newDom.style.display = 'inline-block'
                    }
                    let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                    newDom.setAttribute(global.MORPHES_ID,CST[n].id);
                    let fatherNode = getNode(fatherId, domTree)
                    fatherNode.appendChild(newDom)
                }
                transToHTML(CST[n], domTree)
            } else if (CST[n].type == global.TOKEN.STRING) {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId, domTree)
                let htmlOfDom = fatherNode.innerHTML
                htmlOfDom += CST[n].content
                fatherNode.innerHTML = htmlOfDom
            } else if (CST[n].type == global.TOKEN.ATTR) {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId, domTree)
                fatherNode.setAttribute(CST[n].key, CST[n].value)
            } else if (CST[n].type == global.TOKEN.SCRIPT) {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId, domTree)
                let htmlOfDom = fatherNode.innerHTML
                htmlOfDom += removeBigBrackets(CST[n].script)
                fatherNode.innerHTML = htmlOfDom
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
        if (allNode[i].getAttribute(global.MORPHES_ID) == nodeId) {
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
    global.tempToken = []
}

// 获得第一个非空字符
function getFirstNonSpaceChar (arr) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] != ' ') {
            return arr[i]
        }
    }
    throw 'Error'
}

// 去掉Script的头尾大括号
function removeBigBrackets(sc) {
    return sc.substring(sc.indexOf('{') + 1, sc.lastIndexOf('}'))
}

// 检查Script的大括号格式
function checkScriptBrackets (sc) {
    let left = 0
    let right = 0
    for (let i = 0; i < sc.length; i++) {
        if (sc[i] == '{') {
            left++
        }
        if (sc[i] == '}') {
            right++
        }
    }
    if (left == right) {
        return true
    }
    return false
}

module.exports = {
    compiler
}