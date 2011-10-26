var MsgPack = require('coffeepack'),
    assert = require('assert');

var object = [
    { firstName: 'Devon', lastName: 'Govett', age: 18, alive: true, onaboat: false },
    { "float": 12.53, not: null, infi: Infinity, neg: -Infinity, unicode: "ü€" },
    { large: 10000000000000000, lf: 10000000.2480, neg: -1900, negf: -18392.23749 }
]

assert.deepEqual(MsgPack.unpack(MsgPack.pack(object)), object);