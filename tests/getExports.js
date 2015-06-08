'use strict'

var expect = require('chai').expect
  , path = require('path')
var getExports = require('../getExports')

describe('getExports', function () {
  var fakeContext = { getFilename: function () {
                        return path.join(__dirname, 'files', 'foo.js') }
                    , settings: {} }

  it('handles ExportAllDeclaration', function () {
    var imports
    expect(function () {
      imports = getExports('./export-all', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('foo')).to.be.true

  })

  it('does not throw for a missing file', function () {

    var imports
    expect(function () {
      imports = getExports('./does-not-exist', fakeContext)
    }).not.to.throw(Error)

    expect(imports).not.to.exist

  })

  it('exports explicit names for a missing file in exports', function () {

    var imports
    expect(function () {
      imports = getExports('./exports-missing', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('bar')).to.be.true

  })

  describe('setting: import.interop = common', function () {
    var commonContext = { getFilename: function () {
                            return path.join(__dirname, 'files', 'foo.js') }
                        , settings: { 'import.interop': 'common' } }

    it('reports a default given a module.exports assignment', function () {

      var imports = getExports('./common-module-assignment', commonContext)

      expect(imports.hasDefault).to.be.true

    })

    it('does not normally report a default given a module.exports assignment ' +
       'without interop', function () {

      var imports = getExports('./common-module-assignment', fakeContext)

      expect(imports.hasDefault).to.be.true

    })

    it('reports a default given an exports property assignment', function () {

      var imports = getExports('./common-explicit-export', commonContext)

      expect(imports.hasDefault).to.be.true

    })

    it('reports a default given an exports computed assignment', function () {

      var imports = getExports('./common-computed-export', commonContext)

      expect(imports.hasDefault).to.be.true

    })

  })

  describe('general interop', function () {
    it('does not fail with nonexistent interop', function () {
      var nonexistent = { getFilename: function () {
                            return path.join(__dirname, 'files', 'foo.js') }
                        , settings: { 'import.interop': 'common' } }

      expect(function () { getExports('./export-all', nonexistent) })
        .not.to.throw(Error)
    })
  })


})
