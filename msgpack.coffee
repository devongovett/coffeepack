###
# An implementation of the MessagePack serialization format - http://msgpack.org/
# Copyright (c) 2011 Devon Govett
# MIT LICENSE
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this 
# software and associated documentation files (the "Software"), to deal in the Software 
# without restriction, including without limitation the rights to use, copy, modify, merge, 
# publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
# to whom the Software is furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all copies or 
# substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
###

class MsgPack
    # export the module to CommonJS or the browser
    if module?.exports
        module.exports = MsgPack
    else
        window.MsgPack = MsgPack
    
    idx = 0
    @pack: (data, byteArray = false) ->
        bytes = pack(data, [])
        return bytes if byteArray
        
        fcc = String.fromCharCode
        return (fcc byte for byte in bytes).join ''
    
    @unpack: (data) ->
        if typeof data is 'string'
            data = (data.charCodeAt(i) & 0xff for i in [0...data.length])
        
        idx = 0
        unpack(data)
        
    pack = (val, bytes) ->
        # if the value has a toJSON function, call it
        if val and typeof val is 'object' and typeof val.toJSON is 'function'
            val = val.toJSON()
    
        # null or undefined
        if not val?
            bytes.push 0xc0
    
        # true    
        else if val is true
            bytes.push 0xc3
    
        # false    
        else if val is false
            bytes.push 0xc2
        
        else
            switch typeof val
                when 'number'
                    # NaN
                    if val isnt val
                        bytes.push 0xcb, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
            
                    # infinity
                    else if val is Infinity
                        bytes.push 0xcb, 0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            
                    else if val is -Infinity
                        bytes.push 0xcb, 0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            
                    # integer    
                    else if Math.floor(val) is val and -0x8000000000000000 <= val < 0x10000000000000000
                        # fixnum
                        if -0x20 <= val < 0x80
                            val += 0x100 if val < 0
                            bytes.push val & 0xff
                            
                        # (u)int8
                        else if -0x80 <= val < 0x100
                            type = if val < 0 then 0xd0 else 0xcc
                            val += 0x100 if val < 0
                            bytes.push type, val & 0xff
                        
                        # (u)int16
                        else if -0x8000 <= val < 0x10000
                            type = if val < 0 then 0xd1 else 0xcd
                            val += 0x10000 if val < 0
                            bytes.push type, (val >>> 8) & 0xff, val & 0xff
                        
                        # (u)int32
                        else if -0x80000000 <= val < 0x100000000
                            type = if val < 0 then 0xd2 else 0xce
                            val += 0x100000000 if val < 0
                            bytes.push type, (val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff
                            
                        # (u)int64
                        else
                            type = if val < 0 then 0xd3 else 0xcf
                            high = Math.floor(val / 0x100000000)
                            low  = val & 0xffffffff
                            bytes.push type, (high >>> 24) & 0xff, (high >>> 16) & 0xff,
                                             (high >>>  8) & 0xff,  high         & 0xff,
                                             (low  >>> 24) & 0xff, (low  >>> 16) & 0xff,
                                             (low  >>>  8) & 0xff,  low          & 0xff
                
                    # double
                    else
                        # TODO: encode single precision if possible
                        # based on http://javascript.g.hatena.ne.jp/edvakf/20101128/1291000731
                        sign = val < 0
                        val *= -1 if sign
                
                        # add offset 1023 to ensure positive
                        exp = ((Math.log(val) / Math.LN2) + 1023) | 0
                
                        # shift 52 - (exp - 1023) bits to make integer part exactly 53 bits,
                        # then throw away trash less than decimal point
                        frac = val * Math.pow(2, 52 + 1023 - exp)
                
                        low = frac & 0xffffffff
                        exp |= 0x800 if sign
                        high = ((frac / 0x100000000) & 0xfffff) | (exp << 20)
                
                        bytes.push 0xcb, (high >> 24) & 0xff, (high >> 16) & 0xff,
                                         (high >>  8) & 0xff,  high        & 0xff,
                                         (low  >> 24) & 0xff, (low  >> 16) & 0xff,
                                         (low  >>  8) & 0xff,  low         & 0xff
                                 
                when 'string'
                    # utf-8 encode
                    # http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
                    val = unescape(encodeURIComponent(val))
                    size = val.length
                    
                    # fixraw
                    if size < 0x20
                        bytes.push 0xa0 | size
                    
                    # raw16    
                    else if size < 0x10000
                        bytes.push 0xda, (size >>> 8) & 0xff, size & 0xff
                    
                    # raw32    
                    else if size < 0x100000000
                        bytes.push 0xdb, (size >>> 24) & 0xff, (size >>> 16) & 0xff, (size >>> 8) & 0xff, size & 0xff
                        
                    else
                        throw 'String too long.'
                    
                    for i in [0...size]
                        bytes.push val.charCodeAt(i)
            
                when 'object'
                    # array
                    if Array.isArray(val)
                        len = val.length
                
                        # fixarray
                        if len < 16
                            bytes.push 0x90 + len
                
                        # array16    
                        else if len < 0x10000
                            bytes.push 0xdc, (len >>> 8) & 0xff, len & 0xff
                    
                        # array 32
                        else if len < 0x100000000
                            bytes.push 0xdd, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff
                    
                        else
                            throw 'Array too long.'
                    
                        pack item, bytes for item in val
            
                    # map    
                    else
                        len = Object.keys(val).length
                
                        # fixmap
                        if len < 16
                            bytes.push 0x80 + len
                
                        # map16    
                        else if len < 0x10000
                            bytes.push 0xde, (len >>> 8) & 0xff, len & 0xff
                    
                        # map32
                        else if len < 0x100000000
                            bytes.push 0xdf, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff
                    
                        else
                            throw 'Map has too many keys.'
                    
                        for key, mapval of val
                            pack key, bytes
                            pack mapval, bytes
                    
                else
                    throw 'Unknown value.'
                    
        return bytes
    
    unpack = (buf) ->
        byte = buf[idx++]
        
        # fixnum
        if byte < 0x80
            return byte
        
        # negative fixnum
        if byte >= 0xe0
            return byte - 0x100
            
        if byte >= 0xc0
            switch byte
                # null
                when 0xc0
                    return null
                
                # false
                when 0xc2
                    return false
                
                # true    
                when 0xc3
                    return true
                    
                # float
                when 0xca
                    num = uint32(buf)
                    return 0.0 if not num or num is 0x80000000 # 0.0 or -0.0
                    
                    sign = (num >> 31) * 2 + 1 # +1 or -1
                    exp = (num >> 23) & 0xff
                    frac =  num & 0x7fffff
                    
                    # NaN or Infinity
                    if exp is 0xff
                        return if frac then NaN else sign * Infinity
                        
                    return sign * (frac | 0x00800000) * Math.pow(2, exp - 127 - 23)
                
                # double
                when 0xcb
                    num = uint32(buf)
                    
                    if not num or num is 0x80000000 # 0.0 or -0.0
                        idx += 4
                        return 0.0
                        
                    sign = (num >> 31) * 2 + 1 # +1 or -1
                    exp = (num >> 20) & 0x7ff
                    frac = num & 0xfffff
                    
                    if exp is 0x7ff
                        idx += 4
                        return if frac then NaN else sign * Infinity
                        
                    num = uint32(buf)
                    return sign * ((frac | 0x100000) * Math.pow(2, exp - 1023 - 20) + num * Math.pow(2, exp - 1023 - 52))
                
                # uint8    
                when 0xcc
                    return buf[idx++]
                
                # uint16    
                when 0xcd
                    return uint16(buf)
                    
                # uint32
                when 0xce
                    return uint32(buf)
                    
                # uint64
                when 0xcf
                    return uint32(buf) * 0x100000000 + uint32(buf)
                    
                # int8
                when 0xd0
                    return buf[idx++] - 0x100
                
                # int16    
                when 0xd1
                    return (buf[idx++] << 8) | buf[idx++] - 0x10000
                    
                # int32
                when 0xd2
                    num = uint32(buf)
                    return if num < 0x80000000 then num else num - 0x100000000
                    
                # int64
                when 0xd3
                    # based on https://github.com/uupaa/msgpack.js/blob/master/msgpack.js#L317
                    num = buf[idx++]
                    if num & 0x80 # avoid sign overflow
                        return ((num ^ 0xff) * 0x100000000000000 +
                                (buf[idx++] ^ 0xff) *   0x1000000000000 +
                                (buf[idx++] ^ 0xff) *     0x10000000000 +
                                (buf[idx++] ^ 0xff) *       0x100000000 +
                                (buf[idx++] ^ 0xff) *         0x1000000 +
                                (buf[idx++] ^ 0xff) *           0x10000 +
                                (buf[idx++] ^ 0xff) *             0x100 +
                                (buf[idx++] ^ 0xff) + 1) * -1
                                
                    return num * 0x100000000000000 +
                           buf[idx++] *   0x1000000000000 +
                           buf[idx++] *     0x10000000000 +
                           buf[idx++] *       0x100000000 +
                           buf[idx++] *         0x1000000 +
                           buf[idx++] *           0x10000 +
                           buf[idx++] *             0x100 +
                           buf[idx++]
                    
                # raw16
                when 0xda
                    return raw(buf, uint16(buf))
                    
                # raw32
                when 0xdb
                    return raw(buf, uint32(buf))
                
                # array16    
                when 0xdc
                    return array(buf, uint16(buf))
                
                # array32    
                when 0xdd
                    return array(buf, uint32(buf))
                
                # map16    
                when 0xde
                    return map(buf, uint16(buf))
                    
                # map32
                when 0xdf
                    return map(buf, uint32(buf))
                    
            throw 'Invalid variable code'
        
        # fixraw (utf8 decode)
        if byte >= 0xa0
            return raw(buf, byte & 0x1f)
        
        # fixarray    
        if byte >= 0x90
            return array(buf, byte & 0xf)
            
        # fixmap
        if byte >= 0x80
            return map(buf, byte & 0xf)
            
        throw "Unknown sequence encountered."
        
    uint16 = (buf) ->
        return (buf[idx++] << 8) | buf[idx++]
       
    uint32 = (buf) ->
        return (buf[idx++] << 24 >>> 0) + ((buf[idx++] << 16) | (buf[idx++] << 8) | buf[idx++])
        
    raw = (buf, len) ->
        iz = idx + len
        out = []
        fromCharCode = String.fromCharCode
        while idx < iz
            out.push fromCharCode buf[idx++]
        
        # utf-8 decode
        # http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
        return decodeURIComponent(escape(out.join ''))
        
    array = (buf, num) ->
        out = []
        while num--
            out.push unpack(buf, idx)
            
        return out
        
    map = (buf, num) ->
        out = {}
        while num--
            key = unpack(buf, idx)
            out[key] = unpack(buf, idx)
            
        return out