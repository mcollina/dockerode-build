# dockerode-build

Build a docker container using Dockerode.

## Install

```
npm i fastbind --save
```

## Usage

```js
var bind = require('fastbind')(sum)

function State (a) {
  this.a = a
}

function sum (b) {
  var a = this.a
  console.log(a + b)
}

var state = new State(42)
setImmediate(bind(state), 24)
```

## Alternatives

The other best method for achieving similar performance is:

```js
var a = 42
setImmediate(function (b) {
  aa(a, b)
}, 24)

function sum (a, b) {
  console.log(a + b)
}
```

This is 5-10% slower than fastbind. You decide if fastbind is worth it
or not.

## Acknowledgements

fastbind is sponsored by [nearForm](http://nearform.com).

## License

MIT
