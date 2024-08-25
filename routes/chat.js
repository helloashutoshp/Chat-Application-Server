import express from "express";
import { isAuthenticate } from "../middlewares/auth.js";
import { getmyGroups, getMyChats, newGroupChat, addmembers } from "../controllers/chat.js";
const app = express.Router();
app.use(isAuthenticate);
app.post('/new',newGroupChat);
app.get('/my',getMyChats);
app.get('/my/groupChat',getmyGroups);
app.put('/addMembers',addmembers);


export default app;
