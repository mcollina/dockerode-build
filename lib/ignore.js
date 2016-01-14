'use strict'

var path = require('path')
var fs = require('fs')
var Minimatch = require('minimatch').Minimatch

function buildIgnore (dockerFile, cb) {
  var base = path.dirname(dockerFile)
  var dockerIgnore = path.join(base, '.dockerignore')
  fs.readFile(dockerIgnore, function (err, data) {
    if (err) {
      cb(null, function (file) {
        return false
      })
      return
    }

    var patterns = data
      .toString()
      .split('\n')
      .filter(noBlank)
      .map(rewrite, base)
      .map(toMinimatch)

    cb(null, function ignore (file) {
      return patterns.some(match, file)
    })
  })
}

function noBlank (line) {
  return line.length > 0
}

function rewrite (pattern) {
  return path.join(this, pattern)
}

function toMinimatch (pattern) {
  return new Minimatch(pattern)
}

function match (pattern) {
  return pattern.match(this)
}

module.exports = buildIgnore
