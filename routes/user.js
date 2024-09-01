import express from "express";
import { getProfile, login,logout,newUser, search } from "../controllers/user.js";
import { singleAvtar } from "../middlewares/multer.js";
import { isAuthenticate } from "../middlewares/auth.js";
import { registerValidator,loginValidator,validateHandler } from "../lib/validator.js";
const app = express.Router();
app.post("/new",singleAvtar,registerValidator(),validateHandler,newUser);
app.post("/login",loginValidator(),validateHandler,login);
//Authenticate Routes
app.use(isAuthenticate);
app.get('/profile',getProfile);
app.get('/logout',logout);
app.get('/search',search);
export default app;
