import { Hono } from "hono";
import mongoose from "mongoose";
import { ml_dsa44 } from "@noble/post-quantum/ml-dsa";
import { decode } from "base64-arraybuffer";

function generateToken() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const token = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return token;
}

mongoose.connect("mongodb://localhost:27017/tetris").then(() => {
    console.log("MongoDB connected");
    }).catch((err) => {
    console.error("MongoDB connection error:", err);
});

const tokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: '1m' } // 1分に自動削除
});

const rankingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    score: { type: Number, required: true },
    lines: { type: Number, required: true },
    level: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    message: { type: String, default: "" }
});

const Token = mongoose.model("Token", tokenSchema);
const Ranking = mongoose.model("Ranking", rankingSchema);

// 公開鍵をコードに直接埋め込む (Base64 形式)
const publicKey = "oRw88k+591elldYtsmPTi7ghAtVqnxcBeRs6Evwh5Og=";

const app = new Hono();

app.get("/token", async (c) => {
    const token = generateToken();
    
    await Token.create({ token });

    return c.json({ token });
});



app.post("/ranking", async (c) => {
  const rawBody = await c.req.text();
  const signatureB64 = c.req.header("Authorization");
  if (!signatureB64) {
    return c.json({ message: "Signature required" }, 401);
  }

  const isValid = ml_dsa44.verify(
    new Uint8Array(decode(signatureB64)),
    new TextEncoder().encode(rawBody),
    new Uint8Array(decode(publicKey))
  );

  if (!isValid) {
    return c.json({ message: "Invalid signature" }, 400);
  }

  const { name, score, lines, level, date, message = "" } = JSON.parse(rawBody);
  const ranking = new Ranking({ name, score, lines, level, date, message });
  await ranking.save();

  return c.json({ message: "Ranking saved successfully" });
});
