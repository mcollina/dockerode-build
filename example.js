'use strict'

var build = require('./')
var path = require('path')
var pump = require('pump')

pump(
  build(path.join(__dirname, 'fixture', 'Dockerfile')),
  process.stdout,
  function (err) {
    if (err) {
      console.log('something went wrong:', err.message)
      process.exit(1)
    }
  }
)
