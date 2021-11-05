import { from, to } from "./wallet.js";
import {
    Decodeuint8arr,
    Encodeuint8arr,
    Utf8ArrayToStr,
    largeuint8ArrToString,
} from "./uint8array2string.js";
import base58 from "bs58";

console.log(Decodeuint8arr(Uint8Array.from(from.secretKey)));
console.log(Utf8ArrayToStr(Uint8Array.from(from.secretKey)));
// largeuint8ArrToString(Uint8Array.from(from.secretKey), function (text) {
//     // Hello
//     console.log(text);
// });
// console.log(from.secretKey);

let hex = Buffer.from(Uint8Array.from(to.secretKey)).toString("hex");
console.log(hex);
console.log(hex.length);

console.log(from.publicKey.toBase58());
console.log(from.secretKey.length);
console.log(to.secretKey.length);
console.log(base58.encode(from.secretKey), base58.encode(from.secretKey).length);
console.log(base58.encode(to.secretKey), base58.encode(to.secretKey).length);
