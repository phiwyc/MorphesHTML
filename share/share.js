// 全局变量
module.exports = {
    // 常量
    NODE: 'node_',
    MORPHES_ID: 'morphes_id',
    SRC_PATH: './src',
    TOKEN: {
        STRING: 'string',
        ATTR: 'attr',
        DOM: 'dom',
        COMMENT: 'comment',
        SCRIPT: 'script'
    },
    // CST，MTML的树结构
    mtmlTree: {},
    // 节点计数
    nodeCount: 0,
    // 节点编号
    nodeId: 0,
    // 字符流
    sourceArr: [],
    // 权重树
    weightTree: {},
    // 待编译文件列表
    mtmlFileList: [],
    // 临时存储token
    tempToken: [],
    // 脚本树
    scriptTree: {
        switch: false,
        scriptStr: [],
        left: 0,
        right: 0
    },
    // 正则
    SCRIPT_EXP: /\{[\S\s]+\}/,
    // 编译状态
    isCompiling: false
}