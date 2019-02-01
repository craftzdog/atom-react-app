const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const electronLink = require('electron-link')
const terser = require('terser')
const CONFIG = require('../config')

module.exports = function (packagedAppPath) {
  const snapshotScriptPath = path.join(CONFIG.buildOutputPath, 'startup.js')
  const coreModules = new Set(['electron', 'atom', 'shell', 'WNdb', 'lapack', 'remote'])
  const baseDirPath = path.join(CONFIG.intermediateAppPath, 'static')
  let processedFiles = 0

  return Promise.resolve().then(() => {
    process.stdout.write('\n')

    console.log('Verifying if snapshot can be executed via `mksnapshot`')
    const verifySnapshotScriptPath = path.join(CONFIG.repositoryRootPath, 'script', 'verify-snapshot-script')
    let nodeBundledInElectronPath
    if (process.platform === 'darwin') {
      const executableName = CONFIG.appName
      nodeBundledInElectronPath = path.join(packagedAppPath, 'Contents', 'MacOS', executableName)
    } else if (process.platform === 'win32') {
      nodeBundledInElectronPath = path.join(packagedAppPath, 'atom.exe')
    } else {
      nodeBundledInElectronPath = path.join(packagedAppPath, 'atom')
    }
    childProcess.execFileSync(
      nodeBundledInElectronPath,
      [verifySnapshotScriptPath, snapshotScriptPath],
      {env: Object.assign({}, process.env, {ELECTRON_RUN_AS_NODE: 1})}
    )

    const generatedStartupBlobPath = path.join(CONFIG.buildOutputPath, 'snapshot_blob.bin')
    console.log(`Generating startup blob at "${generatedStartupBlobPath}"`)
    childProcess.execFileSync(
      path.join(CONFIG.repositoryRootPath, 'script', 'node_modules', 'electron-mksnapshot', 'bin', 'mksnapshot'),
      ['--no-use_ic', snapshotScriptPath, '--startup_blob', generatedStartupBlobPath]
    )

    let startupBlobDestinationPath
    if (process.platform === 'darwin') {
      startupBlobDestinationPath = `${packagedAppPath}/Contents/Frameworks/Electron Framework.framework/Resources/snapshot_blob.bin`
    } else {
      startupBlobDestinationPath = path.join(packagedAppPath, 'snapshot_blob.bin')
    }

    console.log(`Moving generated startup blob into "${startupBlobDestinationPath}"`)
    fs.unlinkSync(startupBlobDestinationPath)
    fs.renameSync(generatedStartupBlobPath, startupBlobDestinationPath)
  })
}
