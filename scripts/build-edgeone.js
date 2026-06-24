const fs = require('fs')
const path = require('path')

const root = process.cwd()
const dist = path.join(root, 'dist')
const edgeone = path.join(root, '.edgeone')

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })
fs.rmSync(path.join(edgeone, 'edge-functions'), { recursive: true, force: true })

copyDir(path.join(root, 'edge-functions'), path.join(dist, 'edge-functions'))
copyDir(path.join(root, 'CORSAPI'), path.join(dist, 'CORSAPI'))
fs.copyFileSync(path.join(root, 'package.json'), path.join(dist, 'package.json'))
writeEdgeOneBuildOutput()

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

function writeEdgeOneBuildOutput() {
  const outputDir = path.join(edgeone, 'edge-functions')
  fs.mkdirSync(outputDir, { recursive: true })

  const workerSource = fs.readFileSync(path.join(root, 'CORSAPI', '_worker.js'), 'utf8')
  const wrapperSource = fs.readFileSync(path.join(root, 'edge-functions', 'index.js'), 'utf8')
  const bundledWorker = workerSource.replace('export default {', 'const worker = {')
  const bundledWrapper = wrapperSource.replace("import worker from '../CORSAPI/_worker.js'\n\n", '')

  fs.writeFileSync(path.join(outputDir, 'index.js'), `${bundledWorker}\n\n${bundledWrapper}`)
  fs.writeFileSync(
    path.join(outputDir, 'config.json'),
    JSON.stringify(
      {
        routes: [
          { src: '^/$' },
          { src: '^/health$' },
        ],
        middleware: null,
      },
      null,
      2
    )
  )
}
