// This module exports a function that copies all the static assets into the
// appropriate location in the build output directory.

'use strict'

const execSync = require('child_process').execSync
const path = require('path')
const fs = require('fs-extra')
const CONFIG = require('../config')
const glob = require('glob')
const includePathInPackagedApp = require('./include-path-in-packaged-app')

module.exports = function () {
  console.log(`Copying assets to ${CONFIG.intermediateAppPath}`)

  let depFiles = execSync('npm ls --prod --parseable')
    .toString()
    .split('\n')
    .slice(1)
    .slice(0, -1)

  let srcPaths = [
    path.join(CONFIG.repositoryRootPath, 'benchmarks', 'benchmark-runner.js'),
    path.join(CONFIG.repositoryRootPath, 'dot-atom'),
    path.join(CONFIG.repositoryRootPath, 'exports'),
    path.join(CONFIG.repositoryRootPath, 'package.json'),
    path.join(CONFIG.repositoryRootPath, 'static'),
    path.join(CONFIG.repositoryRootPath, 'src'),
    path.join(CONFIG.repositoryRootPath, 'vendor')
  ]
  srcPaths = srcPaths.concat(depFiles)
  srcPaths = srcPaths.concat(glob.sync(path.join(CONFIG.repositoryRootPath, 'spec', '*.*'), {ignore: path.join('**', '*-spec.*')}))
  for (let srcPath of srcPaths) {
    fs.copySync(srcPath, computeDestinationPath(srcPath), {filter: includePathInPackagedApp, dereference: true})
  }

  fs.copySync(
    path.join(CONFIG.repositoryRootPath, 'resources', 'app-icons', CONFIG.channel, 'png', '1024.png'),
    path.join(CONFIG.intermediateAppPath, 'resources', 'atom.png')
  )
}

function computeDestinationPath (srcPath) {
  const relativePath = path.relative(CONFIG.repositoryRootPath, srcPath)
  return path.join(CONFIG.intermediateAppPath, relativePath)
}
