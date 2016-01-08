'use strict'

function Multiline (stream) {
  if (!(this instanceof Multiline)) {
    return new Multiline(stream)
  }

  this.indexes = {}
  this.total = 1
  this.stream = stream
}

Multiline.prototype.update = function (key, msg) {
  var index = this.indexes[key]
  var output = this.stream
  var toMove = 0
  var line = key + ': ' + msg
  var isNew = index === undefined
  if (isNew) {
    line += '\n'
    index = this.total++
    this.indexes[key] = index
  } else {
    toMove = index - this.total
    output.moveCursor(0, toMove)
    output.clearLine()
  }

  output.write(line)
  output.moveCursor(-line.length, -toMove)
}

module.exports = Multiline

function start () {
  var multiline = new Multiline(process.stdout)

  multiline.update('a', 'hello')
  multiline.update('b', 'hello')
  multiline.update('c', 'hello')

  var count = 0

  setInterval(function () {
    count++
    multiline.update('a', count + '')
    multiline.update('b', count + '')
    multiline.update('c', count + '')
  }, 1000)
}

if (require.main === module) {
  start()
}
