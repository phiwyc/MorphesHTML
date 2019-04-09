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
let domNum = 0
// 权重树
let weightTree = {}
// 节点字符流处理
let strNode = []
// 处理代码字符流
for (let i = 0; i < source.length; i++) {
    sourceArr.push(source[i])
    checkToken()
}
console.log(modcObj)

// 逐行读取token
function checkToken () {
    if(sourceArr.indexOf('\n') >= 0){
        for (let i = 0; i < sourceArr.length; i++) {
            if (sourceArr[i] == '\'') {
                isStr = !isStr
            }
            // 字符串单独处理
            if (isStr) {
                strNode.push(sourceArr[i])
            }else{
                // if (sourceArr[i] == ' ' || sourceArr[i] == '\r') {
                //     continue
                // }
            }
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
    // 字符串判断
    type = getType(pt)
    domNum++
    // 权重判断，用于区分父子类
    if (!weightTree['w' + weight]) {
        weightTree['w' + weight] = []
    }
    // 修改权重树
    weightTree['w' + weight].push(domNum)
    if (weight == 0) {
        modcObj[NODE + domNum] = {
            id: domNum,
            name: pt,
            weight
    }
    } else {
        // 根据权重树寻找父级
        let newNode
        if (type == 'string') {
            newNode = pt.replace(/\'/g, '')
        } else if (type == 'attr') {
            newNode = pt.replace('(', '')
            newNode = newNode.replace(')', '')
        } else {
            newNode = {
                id: domNum,
                name: pt,
                weight
            }
        }
        for(let p = 0; p < weightTree['w' + (weight -1)].length; p++) {
            if (domNum < weightTree['w' + (weight - 1)][p]) {
                addNode(modcObj, NODE + weightTree['w' + (weight -1)][p - 1], NODE + domNum, newNode, type)
                break
            }
            if (p == weightTree['w' + (weight -1)].length - 1) {
                addNode(modcObj, NODE + weightTree['w' + (weight -1)][p], NODE + domNum, newNode, type)
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
                    case 'string':
                        fatherNode[n].content = newNode
                    break
                    case 'attr':
                        let temp = newNode.split(': ')
                        if (temp.length < 2) {
                            temp = newNode.split(':')
                        }
                        let key = temp[0].replace(/ /g, '')
                        let value = temp[1]
                        fatherNode[n][key] = value
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

function getType (token) {
    if (token[0] == '\'') {
        return 'string'
    }
    if (token[0] == '(') {
        if (token.indexOf(':') > 0) {
            return 'attr'
        }
        throw 'Attribute is a KV format'
    }
    if (token[0] == ')') {
        throw 'Attribute should start with "("'
    }
}

function transToHTML (CST) {
    
}
