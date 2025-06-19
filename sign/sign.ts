import { ml_dsa44 } from "@noble/post-quantum/ml-dsa";
import { decode, encode } from "base64-arraybuffer";

const SECRET_KEY_B64 = "610II3p2MK4gjZtR2UOMNdl2jX1OpkyLMLt02Mrmz24=";
const privateKey = new Uint8Array(decode(SECRET_KEY_B64));

const message = JSON.stringify({ example: "data" });
const signature = ml_dsa44.sign(new TextEncoder().encode(message), privateKey);
console.log("signature:", encode(signature));

