#! /usr/bin/env node

'use strict'

var tarfs = require('tar-fs')
var Dockerode = require('dockerode')
var minimist = require('minimist')
var path = require('path')
var split = require('split2')
var through = require('through2')
var pump = require('pump')
var fs = require('fs')
var eos = require('end-of-stream')
var fsAccess = require('fs-access')

function dockerBuild (dockerFile, docker, opts) {
  docker = docker || new Dockerode()

  var result = through.obj(function (chunk, enc, cb) {
    if (chunk.stream) {
      cb(null, chunk.stream)
    } else if (chunk.status) {
      cb(null, chunk.status + '\n')
    } else if (chunk.error) {
      cb(new Error(chunk.error))
    } else {
      cb()
    }
  })

  if (!fsAccess.sync(dockerFile)) {
    dockerFile = path.join(dockerFile, 'Dockerfile')
  }

  fs.readFile(dockerFile, function (err, data) {
    if (err) {
      return result.emit('error', err)
    }

    var from;
    data.toString().split("\n").forEach(function (line) {
      var match = line.match(/^FROM +(.*)$/)
      if (match) {
        from = match[1]
      }
    })

    if (!from) {
      result.emit('error', new Error('no image to pull'))
      return
    }

    docker.pull(from, function (err, stream) {
      if (err) {
        result.emit('error', err)
        return
      }

      stream.pipe(split(looseParse)).pipe(result, { end: false })

      eos(stream, function (err) {
        if (err) {
          result.emit('error', err)
          return
        }

        var tar = tarfs.pack(path.dirname(dockerFile))
        docker.buildImage(tar, {}, function (err, stream) {
          if (err) {
            result.emit('error', err)
            return
          }
          pump(stream, split(looseParse), result)
        })
      })
    })
  })

  return result
}

function looseParse (line) {
  var obj
  try {
    obj = JSON.parse(line)
  } catch (err) {
    // nothing to do
    obj = {}
  }
  return obj
}

module.exports = dockerBuild

function start () {
  var argv = minimist(process.argv.slice(2))
  var dockerFile = argv._[0]

  if (!dockerFile) {
    dockerFile = './Dockerfile'
  }

  dockerFile = path.resolve(dockerFile)

  pump(dockerBuild(dockerFile, null, argv), process.stdout, function (err) {
    handleError(err)
  })

  function handleError (err) {
    if (err) {
      console.error(err.message)
      process.exit(1)
    }
  }
}

if (require.main === module) {
  start()
}
