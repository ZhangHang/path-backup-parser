const jsdom = require('jsdom')
const { JSDOM } = jsdom
const fs = require('fs')
const { exec } = require('child_process')

class PathPost {
    constructor(time, text, imagePath) {
        this.time = time
        this.text = text
        this.imagePath = imagePath
    }
}

const pathBackupPath = process.argv[2]

if (pathBackupPath === undefined) {
    console.log('\033[91m%s\033[0m', '请传入 Paht 备份文件夹路径')
    return
}

var pathPosts = []
const htmlFiles = fs.readdirSync(pathBackupPath)
    .filter((fileName) => {
        return fileName.endsWith("html")
    })
    .map((fileName) => {
        return `${pathBackupPath}/${fileName}`
    })

htmlFiles.forEach((postHTMLPath, index) => {
    try {
        const postContent = fs.readFileSync(postHTMLPath, 'utf8')
        const htmlDom = new JSDOM(postContent)
        const feedElements = htmlDom.window.document.getElementsByClassName('box_feed')
        const posts = Array.from(feedElements).map((el) => {
            const time = el.getElementsByClassName('time')[0].innerHTML
            const text = (function () {
                const targetElement = el.getElementsByClassName('text_content')
                return targetElement.length > 0 ? targetElement[0].innerHTML : undefined
            })()
            const imageFilePath = (function () {
                const targetElement = el.getElementsByTagName('img')
                return targetElement.length > 0 ? targetElement[0].src : undefined
            })()
            return new PathPost(time, text, imageFilePath)
        })
        pathPosts = pathPosts.concat(posts)
    } catch (error) {
        console.log(`文件读取失败 ${postHTMLPath} ${error}`)
    }
})

// todo: 日期解析不精准
pathPosts = pathPosts.sort((leftPost, rightPost) => {
    return (new Date(leftPost.time) > new Date(rightPost.time))
})

try {
    let outputPath = `${pathBackupPath}/path_backup_${(new Date()).getTime()}.json`
    fs.writeFileSync(outputPath, JSON.stringify(pathPosts, null, 2), 'utf8')
    console.log('\033[1;32m%s\033[0m', `解析完成，结果在 ${outputPath}`)
    exec(`open ${outputPath}`)
} catch (error) {
    console.log('\033[91m%s\033[0m', `解析结果写入失败`)
}