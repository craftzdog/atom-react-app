const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const electronLink = require('electron-link')
const terser = require('terser')
const CONFIG = require('../config')
const glob = require('glob')

module.exports = function () {
  const mainScriptsPath = path.join(CONFIG.intermediateAppPath, 'src', 'main-process')
  console.log(`Minifying files in ${mainScriptsPath}`)
  const srcPaths = glob.sync(
    path.join(mainScriptsPath, '*.js')
  )
  let processedFiles = 0

  for (let filePath of srcPaths) {
    if (processedFiles > 0) {
      process.stdout.write('\r')
    }
    process.stdout.write(`Minifying script (${++processedFiles})`)
    const script = fs.readFileSync(filePath, 'utf-8')

    const minification = terser.minify(script, {
      keep_fnames: true,
      keep_classnames: true,
      compress: {keep_fargs: true, keep_infinity: true}
    })
    if (minification.error) {
      process.stdout.write('\n')
      console.error(minification.error)
      throw minification.error
    }
    fs.writeFileSync(filePath, minification.code)
  }

  process.stdout.write('\n')
}
