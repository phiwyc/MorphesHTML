// 读取modc文件
const fs = require('fs')
// 转为字符串
let source = fs.readFileSync('./test.modc').toString()
// 字符流
let sourceArr = []
// 临时存储token
let tempToken = []
// 具体语法树
let modcObj = {}
// 是否为字符串
let isStr = false
// 常量
let NODE = 'node_'
// 节点编号
let nodeCount = 0
let nodeId = 0
// 权重树
let weightTree = {}
// 节点字符流处理
let strNode = []
// 处理代码字符流
console.log('Generate CST...')
for (let i = 0; i < source.length; i++) {
    sourceArr.push(source[i])
    checkToken()
}
console.log(modcObj)
let html = ''
// HTML 转换处理
// 引入JSDOM来方便地生成DOM树
const jsdom = require('jsdom')
const { JSDOM } = jsdom
// 初始DOM树
let domTree = new JSDOM('<!DOCTYPE html><html></html>')
transToHTML(modcObj)
let allDom = domTree.window.document.getElementsByTagName('*')
for (let i = 0; i < allDom.length; i++){
    allDom[i].removeAttribute('morphes-id')
}
console.log(domTree.window.document.documentElement.outerHTML)
fs.mkdirSync('dist')
fs.writeFileSync('./dist/index.html', domTree.window.document.documentElement.outerHTML)

// 逐行读取token
function checkToken () {
    if(sourceArr.indexOf('\n') >= 0){
        for (let i = 0; i < sourceArr.length; i++) {
            if (sourceArr[i] == '\'') {
                isStr = !isStr
            }
            // 字符串单独处理
            // if (isStr) {
            //     strNode.push(sourceArr[i])
            // }else{
            //     // if (sourceArr[i] == ' ' || sourceArr[i] == '\r') {
            //     //     continue
            //     // }
            // }
            tempToken.push(sourceArr[i])
            if ( sourceArr[i] == '\n') {
                setToken()
            }
        }
        sourceArr = []
    }
}

// 构造词法树
function setToken() {
    let pt = tempToken.join('').replace('\n', '').replace('\r', '')
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
    nodeCount++
    // 权重判断，用于区分父子类
    if (!weightTree['w' + weight]) {
        weightTree['w' + weight] = []
    }
    // 修改权重树
    weightTree['w' + weight].push(nodeCount)
    // dom类添加到列表中记录，用于JSDOM处理
    nodeId++
    if (weight == 0) {
        modcObj[NODE + nodeCount] = {
            id: nodeId,
            name: pt,
            type: 'dom',
            weight
        }
    } else {
        // 根据权重树寻找父级
        let newNode
        if (type == 'string') {
            newNode = {
                id: nodeId,
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
                id: nodeId,
                key: attrKey,
                value: attrValue,
                type: 'attr',
                weight
            }
        } else {
            newNode = {
                id: nodeId,
                name: pt,
                type: 'dom',
                weight
            }
        }
        for(let p = 0; p < weightTree['w' + (weight -1)].length; p++) {
            if (nodeCount < weightTree['w' + (weight - 1)][p]) {
                addNode(modcObj, NODE + weightTree['w' + (weight -1)][p - 1], NODE + nodeCount, newNode, type)
                break
            }
            if (p == weightTree['w' + (weight -1)].length - 1) {
                addNode(modcObj, NODE + weightTree['w' + (weight -1)][p], NODE + nodeCount, newNode, type)
                break
            }
        }
    }
    tempToken = []
}

// 添加节点的方法
function addNode(fatherNode, fatherNodeName, newNodeName, newNode, type) {
    for (let n in fatherNode) {
        if (typeof (fatherNode[n]) == 'object') {
            if(n == fatherNodeName) {
                switch(type){
                    // case 'string':
                    //     fatherNode[n].content = newNode
                    // break
                    case 'attr':
                        // 找出第一个冒号的位置
                        
                        // let temp = newNode.split(': ', )
                        // if (temp.length < 2) {
                        //     temp = newNode.split(':')
                        // }
                        // let key = temp[0].replace(/ /g, '')
                        // let value = temp[1]
                        // fatherNode[n].attr[key] = value
                        fatherNode[n][newNodeName] = newNode
                    break
                    default:
                        fatherNode[n][newNodeName] = newNode
                    break
                }
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
function transToHTML (CST) {
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
                    let fatherNode = getNode(fatherId)
                    fatherNode.appendChild(newDom)
                }
                // // 填充属性
                // if (CST[n].attr) {

                // } else {

                // }
                transToHTML(CST[n])
            } else if (CST[n].type == 'string') {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId)
                let htmlOfDom = fatherNode.innerHTML
                htmlOfDom += CST[n].content
                fatherNode.innerHTML = htmlOfDom
            } else if (CST[n].type == 'attr') {
                let fatherId = getFatherNodeId(CST[n].id, CST[n].weight)
                let fatherNode = getNode(fatherId)
                fatherNode.setAttribute(CST[n].key, CST[n].value)
            }
        }
    }
}

// 获得父元素
function getFatherNodeId(nodeId, weight){
    for(let p = 0; p < weightTree['w' + (weight -1)].length; p++) {
        if (nodeId < weightTree['w' + (weight - 1)][p]) {
            return weightTree['w' + (weight - 1)][p - 1]
        }
        if (p == weightTree['w' + (weight -1)].length - 1) {
            return weightTree['w' + (weight - 1)][p]
        }
    }
}

// 获得父节点
function getNode (nodeId) {
    let allNode = domTree.window.document.getElementsByTagName('*')
    for (let i = 0; i < allNode.length; i++) {
        if (allNode[i].getAttribute('morphes-id') == nodeId) {
            return allNode[i]
        } 
    }
    throw 'Somthing wrong...'
}