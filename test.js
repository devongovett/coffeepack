var MsgPack = require('coffeepack'),
    assert = require('assert');

var object = [
    { firstName: 'Devon', lastName: 'Govett', alive: true, onaboat: false },
    { "float": 12.53, not: null, infi: Infinity, neg: -Infinity, unicode: "ü€" },
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
    ],
    // long string
    '50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75'
]

assert.deepEqual(MsgPack.unpack(MsgPack.pack(object)), object);