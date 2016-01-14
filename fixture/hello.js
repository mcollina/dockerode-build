'use strict'

const http = require('http')
const PORT = process.env.PORT || 3000
const fs = require('fs')
const p = require('path')

try {
  fs.accessSync(p.join(__dirname, 'toIgnore'))
  console.log('ignore failed, file present')
} catch (err) {
  // nothing to do
}

http.createServer(function (req, res) {
  res.end('hello world\n')
}).listen(PORT, function (err) {
  if (err) {
    throw err
  }

  console.log('listening on port', PORT)
})
