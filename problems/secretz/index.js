var fs = require('fs')
var path = require('path')
var crypto = require('crypto')
var spawn = require('child_process').spawn
var verify = require('adventure-verify')
var concat = require('concat-stream')
var ciphers = [{
  algorithm: 'aes-192-cbc',
  key: crypto.createHash('md5').update(phrase()).digest('base64'),
  iv: crypto.randomBytes(8).toString('hex')
}]

exports.problem = fs.createReadStream(path.join(__dirname, 'problem.txt'))
exports.solution = fs.createReadStream(path.join(__dirname, 'solution.js'))

var expected = '97911dcc607865d621029f6f927c7851 secretz/METADATA.TXT\n' +
    '2cdcfa9f8bbefb82fb7a894964b5c199 secretz/SPYING.TXT\n'

exports.verify = verify({ modeReset: true }, function (args, t) {
  t.plan(3)
  t.equal(args.length, 1, 'stream-adventure verify YOURFILE.js')

  const { algorithm, key, iv } = ciphers[Math.floor(Math.random() * ciphers.length)]
  var ps = spawn(process.execPath, [args[0], algorithm, key, iv])
  ps.stderr.pipe(process.stderr)
  ps.once('exit', function (code) {
    t.equal(code, 0, 'successful exit code')
  })

  var input = crypto.createCipheriv(algorithm, key, iv)
  if (!input.pipe) {
    t.fail('Your version of node is too old to play this level.' +
            ' Please upgrade to node >= 0.10.'
    )
  }

  fs.createReadStream(path.join(__dirname, '/secretz.tar.gz'))
    .pipe(input).pipe(ps.stdin)

  ps.stdout.pipe(concat(function (body) {
    t.equal(body.toString(), expected)
  }))
})

exports.run = function (args) {
  const { algorithm, key, iv } = ciphers[Math.floor(Math.random() * ciphers.length)]
  var ps = spawn(process.execPath, [args[0], algorithm, key, iv])
  ps.stderr.pipe(process.stderr)

  var input = crypto.createCipheriv(algorithm, key, iv)
  fs.createReadStream(path.join(__dirname, '/secretz.tar.gz'))
    .pipe(input).pipe(ps.stdin)

  ps.stdout.pipe(process.stdout)
}

function phrase () {
  var s = ''
  for (var i = 0; i < 16; i++) {
    s += String.fromCharCode(Math.random() * 26 + 97)
  }
  return s
}
