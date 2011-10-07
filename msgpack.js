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
  */
  var MsgPack;
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
      var char, exp, frac, high, i, item, key, len, low, mapval, pos, sign, size, _i, _len, _ref;
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
              if (val >= 0) {
                if (val < 0x80) {
                  bytes.push(val);
                } else if (val < 0x100) {
                  bytes.push(0xcc, val);
                } else if (val < 0x10000) {
                  bytes.push(0xcd, val >> 8, val & 0xff);
                } else if (val < 0x100000000) {
                  bytes.push(0xce, val >>> 24, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
                } else {
                  high = Math.floor(val / 0x100000000);
                  low = val & 0xffffffff;
                  bytes.push(0xcf, (high >> 24) & 0xff, (high >> 16) & 0xff, (high >> 8) & 0xff, high & 0xff, (low >> 24) & 0xff, (low >> 16) & 0xff, (low >> 8) & 0xff, low & 0xff);
                }
              } else {
                if (val >= -32) {
                  bytes.push(0xe0 + val + 32);
                } else if (val >= -0x80) {
                  bytes.push(0xd0, val + 0x100);
                } else if (val >= -0x8000) {
                  val += 0x10000;
                  bytes.push(0xd1, val >> 8, val & 0xff);
                } else if (val >= -0x80000000) {
                  val += 0x100000000;
                  bytes.push(0xd2, val >>> 24, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
                } else {
                  high = Math.floor(val / 0x100000000);
                  low = val & 0xffffffff;
                  bytes.push(0xd3, (high >> 24) & 0xff, (high >> 16) & 0xff, (high >> 8) & 0xff, high & 0xff, (low >> 24) & 0xff, (low >> 16) & 0xff, (low >> 8) & 0xff, low & 0xff);
                }
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
            len = val.length;
            pos = bytes.length;
            bytes.push(0);
            for (i = 0, _ref = val.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
              char = val.charCodeAt(i);
              if (char < 0x80) {
                bytes.push(char & 0x7f);
              } else if (char < 0x0800) {
                bytes.push(((char >>> 6) & 0x1f) | 0xc0, (char & 0x3f) | 0x80);
              } else if (char < 0x10000) {
                bytes.push(((char >>> 12) & 0x0f) | 0xe0, ((char >>> 6) & 0x3f) | 0x80, (char & 0x3f) | 0x80);
              }
            }
            size = bytes.length - pos - 1;
            if (size < 32) {
              bytes[pos] = 0xa0 | size;
            } else if (size < 0x10000) {
              bytes.splice(pos, 1, 0xda, size >> 8, size & 0xff);
            } else if (size < 0x100000000) {
              bytes.splice(pos, 1, 0xdb, size >>> 24, (size >> 16) & 0xff, (size >> 8) & 0xff, size & 0xff);
            } else {
              throw 'String too long.';
            }
            break;
          case 'object':
            if (Array.isArray(val)) {
              len = val.length;
              if (len < 16) {
                bytes.push(0x90 + len);
              } else if (len < 0x10000) {
                bytes.push(0xdc, len >> 8, len & 0xff);
              } else if (len < 0x100000000) {
                bytes.push(0xdd, len >>> 24, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff);
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
                bytes.push(0xde, size >> 8, size & 0xff);
              } else if (len < 0x100000000) {
                bytes.push(0xdf, len >>> 24, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff);
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
      return (buf[idx++] << 24) | (buf[idx++] << 16) | (buf[idx++] << 8) | buf[idx++];
    };
    raw = function(buf, len) {
      var char, fromCharCode, i, iz, out;
      iz = idx + len;
      out = [];
      i = 0;
      fromCharCode = String.fromCharCode;
      while (idx < iz) {
        char = buf[idx++];
        if (char < 0x80) {
          out[i++] = fromCharCode(char);
        } else if (char < 0xe0) {
          out[i++] = fromCharCode((char & 0x1f) << 6 | (buf[idx++] & 0x3f));
        } else {
          out[i++] = fromCharCode((char & 0x0f) << 12 | (buf[idx++] & 0x3f) << 6 | (buf[idx++] & 0x3f));
        }
      }
      return out.join('');
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
