# dockerode-build

Build a docker container using streams and Dockerode.

## Install

```
npm i dockerode-build --save
```

## Usage

```js
'use strict'

var build = require('dockerode-build')
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
```

## API

### dockerodeBuild(path[, opts])

Start a building stream from the given `path` to a `Dockerfile`.
If the `path` is not absolute, it is resolved against `process.cwd()`.

It returns a stream, that can be piped to the output destination.

If that stream is piped to a TTY, such as a `process.stdout`, the
download progress bar will be automatically show, exactly like `docker build .`.

The opts are passed straight to
[`dockerorde.buildImage()`](http://npm.im/dockerode). If you add a
`docker` opts, that would be used to instantiate the Dockerode
instance with the given options (you would need this for auth).

Events:

* `complete`: building the image is complete, and the image id is the
  first argument.
* `downloadProgress`: emits the metadata returned by Docker to show the
  progress bars.

## Acknowledgements

dockerode-build is sponsored by [nearForm](http://nearform.com).

## License

MIT
