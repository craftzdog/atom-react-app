const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const CONFIG = require('../config')
const _ = require('underscore-plus')
const nodeExternals = require('webpack-node-externals');

module.exports = function () {
  return new Promise(function (resolve, reject) {
    console.log('Bundling with webpack...')
    const baseDirPath = path.join(CONFIG.repositoryRootPath, 'src')
    const allMods = _.flatten([
      ...fs.readdirSync(path.join(CONFIG.repositoryRootPath, 'node_modules')).map(name => {
        if (name.startsWith('@')) {
          return fs
            .readdirSync(path.join(CONFIG.repositoryRootPath, 'node_modules', name))
            .map(domainMod => `${name}/${domainMod}`)
        }
        return name
      }),
      'atom'
    ])
    .map(name => new RegExp(`^${name}(|\/.*)$`))
    .map(
      regexp =>
        function(context, request, callback) {
          if (regexp.test(request)) {
            return callback(null, 'commonjs ' + request)
          }
          callback()
        }
    )
    const extMods = nodeExternals({ modulesDir: path.join(CONFIG.repositoryRootPath, 'node_modules') })

    const mainConfig = {
      mode: 'development',
      devtool: 'source-map',
      context: path.join(__dirname, '..'),
      target: 'electron-main',
      output: {
        path: path.join(CONFIG.intermediateAppPath, 'src', 'main-process'),
        filename: 'start.bundle.js'
      },
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            loader: 'babel-loader',
            options: {
              sourceMap: 'inline',
              presets: [
                ['env', {
                  targets: { node: '8.9.3' },
                  useBuiltIns: 'usage',
                  debug: false
                }]
              ]
            }
          },
          {
            test: /\.coffee$/,
            loader: 'coffee-loader'
          }
        ]
      },
      entry: path.join(baseDirPath, 'main-process', 'start.js'),
      resolve: {
        extensions: ['.js', '.json', '.jsx', '.node', '.coffee']
      },
      externals: [extMods],
      optimization: {
        nodeEnv: false
      }
    }

    webpack(mainConfig, function (err, stats) {
      if (err || stats.hasErrors()) {
        reject(err || stats.toString({ colors: true }))
      } else {
        resolve(stats)
      }
    })
  })
}
