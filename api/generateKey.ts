import { ml_dsa44 } from "@noble/post-quantum/ml-dsa";
import { encode } from "base64-arraybuffer";

const keyPair = ml_dsa44.keyPair();

console.log("publicKey:", encode(keyPair.publicKey));
console.log("secretKey:", encode(keyPair.secretKey));

