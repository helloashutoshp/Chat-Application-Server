import express from "express";
import { getProfile, login,logout,newUser, search } from "../controllers/user.js";
import { singleAvtar } from "../middlewares/multer.js";
import { isAuthenticate } from "../middlewares/auth.js";
const app = express.Router();
app.post("/new",singleAvtar,newUser);
app.post("/login",login);
//Authenticate Routes
app.use(isAuthenticate);
app.get('/profile',getProfile);
app.get('/logout',logout);
app.get('/search',search);
export default app;
