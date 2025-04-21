import { Hono } from "hono";
import mongoose, { mongo } from "mongoose";

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



const app = new Hono();

app.get("/token", (c) => {
});

