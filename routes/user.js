import express from "express";
import { login,newUser } from "../controllers/user.js";
import { singleAvtar } from "../middlewares/multer.js";
const app = express.Router();
app.post("/new",singleAvtar,newUser);
app.post("/login", login);
export default app;
