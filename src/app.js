import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: [
      "https://project-zz9lk.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

connectDB();

app.use("/api", routes);

app.listen(5000, '0.0.0.0', () => {
  console.log("Server running 🔥");
});