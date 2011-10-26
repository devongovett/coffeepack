(function() {
  /*
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
  */  var MsgPack;
  MsgPack = (function() {
    var array, idx, map, pack, raw, uint16, uint32, unpack;
    function MsgPack() {}
    if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
      module.exports = MsgPack;
    } else {
      window.MsgPack = MsgPack;
    }
    idx = 0;
    MsgPack.pack = function(data, byteArray) {
      var byte, bytes, fcc;
      if (byteArray == null) {
        byteArray = false;
      }
      bytes = pack(data, []);
      if (byteArray) {
        return bytes;
      }
      fcc = String.fromCharCode;
      return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = bytes.length; _i < _len; _i++) {
          byte = bytes[_i];
          _results.push(fcc(byte));
        }
        return _results;
      })()).join('');
    };
    MsgPack.unpack = function(data) {
      var i;
      if (typeof data === 'string') {
        data = (function() {
          var _ref, _results;
          _results = [];
          for (i = 0, _ref = data.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
            _results.push(data.charCodeAt(i) & 0xff);
          }
          return _results;
        })();
      }
      idx = 0;
      return unpack(data);
    };
    pack = function(val, bytes) {
      var exp, frac, high, i, item, key, len, low, mapval, sign, size, type, _i, _len;
      if (val && typeof val === 'object' && typeof val.toJSON === 'function') {
        val = val.toJSON();
      }
      if (!(val != null)) {
        bytes.push(0xc0);
      } else if (val === true) {
        bytes.push(0xc3);
      } else if (val === false) {
        bytes.push(0xc2);
      } else {
        switch (typeof val) {
          case 'number':
            if (val !== val) {
              bytes.push(0xcb, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
            } else if (val === Infinity) {
              bytes.push(0xcb, 0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
            } else if (val === -Infinity) {
              bytes.push(0xcb, 0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
            } else if (Math.floor(val) === val && (-0x8000000000000000 <= val && val < 0x10000000000000000)) {
              if ((-0x20 <= val && val < 0x80)) {
                if (val < 0) {
                  val += 0x100;
                }
                bytes.push(val & 0xff);
              } else if ((-0x80 <= val && val < 0x100)) {
                type = val < 0 ? 0xd0 : 0xcc;
                if (val < 0) {
                  val += 0x100;
                }
                bytes.push(type, val & 0xff);
              } else if ((-0x8000 <= val && val < 0x10000)) {
                type = val < 0 ? 0xd1 : 0xcd;
                if (val < 0) {
                  val += 0x10000;
                }
                bytes.push(type, (val >>> 8) & 0xff, val & 0xff);
              } else if ((-0x80000000 <= val && val < 0x100000000)) {
                type = val < 0 ? 0xd2 : 0xce;
                if (val < 0) {
                  val += 0x100000000;
                }
                bytes.push(type, (val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff);
              } else {
                type = val < 0 ? 0xd3 : 0xcf;
                high = Math.floor(val / 0x100000000);
                low = val & 0xffffffff;
                bytes.push(type, (high >>> 24) & 0xff, (high >>> 16) & 0xff, (high >>> 8) & 0xff, high & 0xff, (low >>> 24) & 0xff, (low >>> 16) & 0xff, (low >>> 8) & 0xff, low & 0xff);
              }
            } else {
              sign = val < 0;
              if (sign) {
                val *= -1;
              }
              exp = ((Math.log(val) / Math.LN2) + 1023) | 0;
              frac = val * Math.pow(2, 52 + 1023 - exp);
              low = frac & 0xffffffff;
              if (sign) {
                exp |= 0x800;
              }
              high = ((frac / 0x100000000) & 0xfffff) | (exp << 20);
              bytes.push(0xcb, (high >> 24) & 0xff, (high >> 16) & 0xff, (high >> 8) & 0xff, high & 0xff, (low >> 24) & 0xff, (low >> 16) & 0xff, (low >> 8) & 0xff, low & 0xff);
            }
            break;
          case 'string':
            val = unescape(encodeURIComponent(val));
            size = val.length;
            if (size < 0x20) {
              bytes.push(0xa0 | size);
            } else if (size < 0x10000) {
              bytes.push(0xda);
            } else if (size < 0x100000000) {
              bytes.push(0xdb);
            } else {
              throw 'String too long.';
            }
            for (i = 0; 0 <= size ? i < size : i > size; 0 <= size ? i++ : i--) {
              bytes.push(val.charCodeAt(i));
            }
            break;
          case 'object':
            if (Array.isArray(val)) {
              len = val.length;
              if (len < 16) {
                bytes.push(0x90 + len);
              } else if (len < 0x10000) {
                bytes.push(0xdc, (len >>> 8) & 0xff, len & 0xff);
              } else if (len < 0x100000000) {
                bytes.push(0xdd, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff);
              } else {
                throw 'Array too long.';
              }
              for (_i = 0, _len = val.length; _i < _len; _i++) {
                item = val[_i];
                pack(item, bytes);
              }
            } else {
              len = Object.keys(val).length;
              if (len < 16) {
                bytes.push(0x80 + len);
              } else if (len < 0x10000) {
                bytes.push(0xde, (len >>> 8) & 0xff, len & 0xff);
              } else if (len < 0x100000000) {
                bytes.push(0xdf, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff);
              } else {
                throw 'Map has too many keys.';
              }
              for (key in val) {
                mapval = val[key];
                pack(key, bytes);
                pack(mapval, bytes);
              }
            }
            break;
          default:
            throw 'Unknown value.';
        }
      }
      return bytes;
    };
    unpack = function(buf) {
      var byte, exp, frac, num, sign;
      byte = buf[idx++];
      if (byte < 0x80) {
        return byte;
      }
      if (byte >= 0xe0) {
        return byte - 0x100;
      }
      if (byte >= 0xc0) {
        switch (byte) {
          case 0xc0:
            return null;
          case 0xc2:
            return false;
          case 0xc3:
            return true;
          case 0xca:
            num = uint32(buf);
            if (!num || num === 0x80000000) {
              return 0.0;
            }
            sign = (num >> 31) * 2 + 1;
            exp = (num >> 23) & 0xff;
            frac = num & 0x7fffff;
            if (exp === 0xff) {
              if (frac) {
                return NaN;
              } else {
                return sign * Infinity;
              }
            }
            return sign * (frac | 0x00800000) * Math.pow(2, exp - 127 - 23);
          case 0xcb:
            num = uint32(buf);
            if (!num || num === 0x80000000) {
              idx += 4;
              return 0.0;
            }
            sign = (num >> 31) * 2 + 1;
            exp = (num >> 20) & 0x7ff;
            frac = num & 0xfffff;
            if (exp === 0x7ff) {
              idx += 4;
              if (frac) {
                return NaN;
              } else {
                return sign * Infinity;
              }
            }
            num = uint32(buf);
            return sign * ((frac | 0x100000) * Math.pow(2, exp - 1023 - 20) + num * Math.pow(2, exp - 1023 - 52));
          case 0xcc:
            return buf[idx++];
          case 0xcd:
            return uint16(buf);
          case 0xce:
            return uint32(buf);
          case 0xcf:
            return uint32(buf) * 0x100000000 + uint32(buf);
          case 0xd0:
            return buf[idx++] - 0x100;
          case 0xd1:
            return (buf[idx++] << 8) | buf[idx++] - 0x10000;
          case 0xd2:
            num = uint32(buf);
            if (num < 0x80000000) {
              return num;
            } else {
              return num - 0x100000000;
            }
          case 0xd3:
            num = buf[idx++];
            if (num & 0x80) {
              return ((num ^ 0xff) * 0x100000000000000 + (buf[idx++] ^ 0xff) * 0x1000000000000 + (buf[idx++] ^ 0xff) * 0x10000000000 + (buf[idx++] ^ 0xff) * 0x100000000 + (buf[idx++] ^ 0xff) * 0x1000000 + (buf[idx++] ^ 0xff) * 0x10000 + (buf[idx++] ^ 0xff) * 0x100 + (buf[idx++] ^ 0xff) + 1) * -1;
            }
            return num * 0x100000000000000 + buf[idx++] * 0x1000000000000 + buf[idx++] * 0x10000000000 + buf[idx++] * 0x100000000 + buf[idx++] * 0x1000000 + buf[idx++] * 0x10000 + buf[idx++] * 0x100 + buf[idx++];
          case 0xda:
            return raw(buf, uint16(buf));
          case 0xdb:
            return raw(buf, uint32(buf));
          case 0xdc:
            return array(buf, uint16(buf));
          case 0xdd:
            return array(buf, uint32(buf));
          case 0xde:
            return map(buf, uint16(buf));
          case 0xdf:
            return map(buf, uint32(buf));
        }
        throw 'Invalid variable code';
      }
      if (byte >= 0xa0) {
        return raw(buf, byte & 0x1f);
      }
      if (byte >= 0x90) {
        return array(buf, byte & 0xf);
      }
      if (byte >= 0x80) {
        return map(buf, byte & 0xf);
      }
      throw "Unknown sequence encountered.";
    };
    uint16 = function(buf) {
      return (buf[idx++] << 8) | buf[idx++];
    };
    uint32 = function(buf) {
      return (buf[idx++] << 24 >>> 0) + ((buf[idx++] << 16) | (buf[idx++] << 8) | buf[idx++]);
    };
    raw = function(buf, len) {
      var fromCharCode, iz, out;
      iz = idx + len;
      out = [];
      fromCharCode = String.fromCharCode;
      while (idx < iz) {
        out.push(fromCharCode(buf[idx++]));
      }
      return decodeURIComponent(escape(out.join('')));
    };
    array = function(buf, num) {
      var out;
      out = [];
      while (num--) {
        out.push(unpack(buf, idx));
      }
      return out;
    };
    map = function(buf, num) {
      var key, out;
      out = {};
      while (num--) {
        key = unpack(buf, idx);
        out[key] = unpack(buf, idx);
      }
      return out;
    };
    return MsgPack;
  })();
}).call(this);
