import express from "express";
import { isAuthenticate } from "../middlewares/auth.js";
import { newGroupChat } from "../controllers/chat.js";
const app = express.Router();
app.use(isAuthenticate);
app.post('/new',newGroupChat)
export default app;
