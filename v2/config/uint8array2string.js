/**
 * Convert an Uint8Array into a string.
 *
 * @returns {String}
 */
function Decodeuint8arr(uint8array) {
    return new TextDecoder("utf-8").decode(uint8array);
}

/**
 * Convert a string into a Uint8Array.
 *
 * @returns {Uint8Array}
 */
function Encodeuint8arr(myString) {
    return new TextEncoder("utf-8").encode(myString);
}

function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    
    while(i < len) {
        c = array[i++];
        switch(c >> 4){ 
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            // 0xxxxxxx
            out += String.fromCharCode(c);
            break;
        case 12: case 13:
            // 110x xxxx   10xx xxxx
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
        case 14:
            // 1110 xxxx  10xx xxxx  10xx xxxx
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
            break;
        }
    }

    return out;
}

function largeuint8ArrToString(uint8arr, callback) {
    var bb = new Blob([uint8arr]);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result);
    };
    
    f.readAsText(bb);
}

export { Decodeuint8arr, Encodeuint8arr, Utf8ArrayToStr, largeuint8ArrToString };
