import express from "express";
import userRoute from "./routes/user.js";
import { connectDb } from "./utils/feature.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env", 
});
const mongoURI = process.env.MONGO_URI;
console.log(mongoURI);
const port = process.env.PRO || 3000;
connectDb(mongoURI);
const app = express();
app.use(express.json());
app.use("/user", userRoute);
app.get("/", (req, res) => {
  res.send("hi");
});
app.listen(port, () => {
  console.log(`hello the port is ${port}`);
});
