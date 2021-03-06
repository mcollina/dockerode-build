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
var jsonStream = require('JSONStream')
var multiline = require('multiline-update')
var buildIgnore = require('./lib/ignore')

function dockerBuild (dockerFile, opts) {
  opts = opts || {}
  var docker = new Dockerode(opts.docker)

  var result = through.obj(function (chunk, enc, cb) {
    if (chunk.stream) {
      cb(null, chunk.stream)
      var match = chunk.stream.trim().match(/Successfully built ([^ ]+)$/)
      if (match) {
        emitComplete(docker, this, match[1])
      }
    } else if (chunk.progressDetail) {
      this.emit('downloadProgress', chunk)
      cb()
    } else if (chunk.status) {
      cb(null, chunk.status + '\n')
    } else if (chunk.error) {
      cb(new Error(chunk.error))
    } else {
      cb()
    }
  })

  try {
    var stat = fs.statSync(dockerFile)
    if (!stat.isFile()) {
      dockerFile = path.join(dockerFile, 'Dockerfile')
    }
  } catch (err) {
    process.nextTick(function () {
      result.emit('error', err)
    })
    return
  }

  fs.readFile(dockerFile, function (err, data) {
    if (err) {
      return result.emit('error', err)
    }

    var from
    data.toString().split(/\r?\n/).forEach(function (line) {
      var match = line.match(/^FROM +(.*)$/)
      if (match) {
        from = match[1]
      }
    })

    if (!from) {
      result.emit('error', new Error('no image to pull'))
      return
    }

    if (from.indexOf(':') < 0) {
      from += ':latest'
    }

    docker.pull(from, function (err, stream) {
      if (err) {
        result.emit('error', err)
        return
      }

      stream.pipe(jsonStream.parse()).pipe(result, { end: false })

      eos(stream, function (err) {
        if (err) {
          result.emit('error', err)
          return
        }

        buildIgnore(dockerFile, function (err, ignore) {
          if (err) {
            result.emit('error', err)
            return
          }

          var tar = tarfs.pack(path.dirname(dockerFile), {
            ignore: ignore
          })
          docker.buildImage(tar, opts, function (err, stream) {
            if (err) {
              result.emit('error', err)
              return
            }
            pump(stream, split(JSON.parse), result)
          })
        })
      })
    })
  })

  result._pipe = result.pipe
  result.pipe = function (dest) {
    if (dest.isTTY) {
      progressBars(this, dest)
    }
    return result._pipe(dest)
  }

  return result
}

function emitComplete (docker, stream, id) {
  docker.getImage(id).inspect(function (err, data) {
    if (err) {
      stream.emit('error', err)
      return
    }
    stream.emit('complete', data.Id)
  })
}

module.exports = dockerBuild

function progressBars (buildStream, output) {
  var multi = multiline(output)

  buildStream.on('downloadProgress', function (progress) {
    var line = progress.status

    if (progress.progress) {
      line += ' ' + progress.progress
    }

    multi.update(progress.id, line)
  })
}

function start () {
  var argv = minimist(process.argv.slice(2))
  var dockerFile = argv._[0]

  if (!dockerFile) {
    dockerFile = './Dockerfile'
  }

  dockerFile = path.resolve(dockerFile)

  pump(dockerBuild(dockerFile, argv), process.stdout, function (err) {
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
