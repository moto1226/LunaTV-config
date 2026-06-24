const fs = require('fs')
const path = require('path')

const root = process.cwd()
const dist = path.join(root, 'dist')

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })

copyDir(path.join(root, 'edge-functions'), path.join(dist, 'edge-functions'))
copyDir(path.join(root, 'CORSAPI'), path.join(dist, 'CORSAPI'))
fs.copyFileSync(path.join(root, 'package.json'), path.join(dist, 'package.json'))

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true })

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}
