import express from "express";
import { connectDb } from "./utils/feature.js";
import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import { createuser } from "./seeders/user.js";


dotenv.config({
  path: "./.env", 
});
const mongoURI = process.env.MONGO_URI;
console.log(mongoURI);
const port = process.env.PRO || 3000;
connectDb(mongoURI);
// createuser(10);
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/user", userRoute);
app.use("/chat", chatRoute);

app.get("/", (req, res) => {
  res.send("hi");
});
app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`hello the port is ${port}`);
});
