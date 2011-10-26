var MsgPack = require('coffeepack'),
    assert = require('assert');

var object = [
    { firstName: 'Devon', lastName: 'Govett', age: 18, alive: true, onaboat: false },
    { "float": 12.53, not: null, infi: Infinity, neg: -Infinity, unicode: "ü€" },
    { large: 10000000000000000, lf: 10000000.2480, neg: -1900, negf: -18392.23749 },
    [
        Infinity,
        -Infinity,

        100, // positive fixnum
        0xF0, // uint8
        0xFFF0, //uint16
        0xFFFFFFF0, // uint32 (with sign bit turned on)
        0x1FFFFFFFF, // uint64 with bit 31 on (sign bit for right half)
        0xFFFFFFFFFFFFFF0, // uint64

        -100, // negative fixnum
        -0xF0, // int8
        -0xFFF0, //int16
        -0xFFFFFFF0, // int32
        -0xFFFFFFFFFFFFFF0, // int64

        1.0384583e+34, // double with all fraction bits on
    ]
]

assert.deepEqual(MsgPack.unpack(MsgPack.pack(object)), object);