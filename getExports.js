'use strict'

var
  Map = require('es6-map'), // eslint-disable-line no-native-reassign
  Set = require('es6-set'), // eslint-disable-line no-native-reassign
  parse = require('./lib/parse'),
  resolve = require('./resolve'),
  isCore = require('resolve').isCore

var exportCache = new Map()

function ExportMap(settings) {
  this.settings = settings

  this.hasDefault = false
  this.named = new Set()

  this.errors = []

  if (settings['import.interop']) {
    try {
      this.interop = require('./interop/' + settings['import.interop'])
    } catch (err) {
      // ignore?
    }
  }
}

ExportMap.get = function (source, context) {

  var path = resolve(source, context)
  if (path == null) return null

  return ExportMap.for(path, context.settings)
}

ExportMap.for = function (path, settings) {
  var exportMap = exportCache.get(path)
  if (exportMap != null) return exportMap

  exportMap = ExportMap.parse(path, settings)

  exportCache.set(path, exportMap)

  // Object.freeze(exportMap)
  // Object.freeze(exportMap.named)

  return exportMap
}

ExportMap.parse = function (path, settings) {
  var m = new ExportMap(settings)

  if (isCore(path)) return m // skip parsing

  try {
    var ast = parse(path)
  } catch (err) {
    m.errors.push(err)
    return m // can't continue
  }

  ast.body.forEach(function (n) {
    m.captureDefault(n)
    m.captureAll(n, path)
    m.captureNamedDeclaration(n)
  })

  return m
}



ExportMap.prototype.captureDefault = function (n) {
  if (this.hasDefault) return // don't need to check anymore

  // todo: abstract away
  if (this.interop && this.interop.captureDefault) {

    if (this.interop.captureDefault(n)) {
      this.hasDefault = true

      return
    }
  }

  if (n.type !== 'ExportDefaultDeclaration') return

  this.hasDefault = true
}

ExportMap.prototype.captureAll = function (n, path) {
  if (n.type !== 'ExportAllDeclaration') return

  var remotePath = resolve.relative(n.source.value, path)
  if (remotePath == null) return

  var remoteMap = ExportMap.for(remotePath, this.settings)

  remoteMap.named.forEach(function (name) { this.named.add(name) }.bind(this))
}

ExportMap.prototype.captureNamedDeclaration = function (n) {
  if (n.type !== 'ExportNamedDeclaration') return

  // capture declaration
  if (n.declaration != null) {
    switch (n.declaration.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        this.named.add(n.declaration.id.name)
        break
      case 'VariableDeclaration':
        n.declaration.declarations.forEach(function (d) {
          this.named.add(d.id.name)
        }.bind(this))
        break
    }
  }

  // capture specifiers
  n.specifiers.forEach(function (s) {
    this.named.add(s.exported.name)
  }.bind(this))
}

module.exports = ExportMap.get
