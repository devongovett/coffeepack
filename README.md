[![build status](https://secure.travis-ci.org/devongovett/coffeepack.png)](http://travis-ci.org/devongovett/coffeepack)
CoffeePack
----------
An implementation of the MessagePack serialization format in CoffeeScript for Node.js and the browser.

[MessagePack](http://msgpack.org/) is a binary-based object serialization library. It's like JSON 
but much more space efficient.

## Node Installation
    npm install coffeepack
    
## Browser Installation
    <script type="text/javascript" src="http://example.com/path/to/msgpack.js"></script>
    <script type="text/javascript">
        // Use the MsgPack global variable as shown below...
    </script>
    
## Usage

While CoffeePack is written in CoffeeScript, it can be used from both CoffeeScript and plain 'ol JavaScript. 
There are two methods provided by coffeepack, `pack` and `unpack`.

    var MsgPack = require('coffeepack'),
        assert = require('assert');
        
    var object = {
        foo: "bar",
        baz: [1, 2, 3],
        person: {
            firstName: 'Devon',
            lastName: 'Govett'
        }
    }
    
    assert.deepEqual(MsgPack.unpack(MsgPack.pack(object)), object);
    
By default, `MsgPack.pack` returns a binary string, but if you'd like an array of bytes instead, just 
pass `true` as the second argument.

`MsgPack.unpack` expects either an array of bytes or a binary string and returns a JavaScript object.

## LICENSE

CoffeePack is licensed under the MIT LICENSE.