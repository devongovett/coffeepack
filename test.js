var MsgPack = require('coffeepack'),
    assert = require('assert');

var object = {
    foo: "bar",
    baz: [1, 2, 3, Infinity, -Infinity],
    person: {
        firstName: 'Devon',
        lastName: 'Govett'
    }
}

assert.deepEqual(MsgPack.unpack(MsgPack.pack(object)), object);
