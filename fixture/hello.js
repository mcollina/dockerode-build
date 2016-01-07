'use strict'

const http = require('http')
const PORT = process.env.PORT || 3000

http.createServer(function (req, res) {
  res.end('hello world\n')
}).listen(PORT, function (err) {
  if (err) {
    throw err
  }

  console.log('listening on port', PORT)
})
