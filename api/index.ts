import { Hono } from "hono";
import mongoose, { mongo } from "mongoose";
import {
    ml_dsa44
} from "@noble/post-quantum/ml-dsa"
import { encode, decode } from "base64-arraybuffer"

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

const publicKey = ""

const app = new Hono();

app.get("/token", async (c) => {
    const token = generateToken();
    
    await Token.create({ token });

    return c.json({ token });
});



app.post("/ranking", async (c) => {
    const body = c.req.raw.body
    const authHeader = c.req.header("Authorization")

    if(ml_dsa44.verify(new Uint8Array(decode(authHeader!)), body, authHeader)) {
        const { name, score, lines, level, date } = JSON.parse(body);
        const ranking = new Ranking({ name, score, lines, level, date, message });
        await ranking.save();

        return c.json({ message: "Ranking saved successfully" });
    }


});
