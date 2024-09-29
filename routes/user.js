import express from "express";
import {
  acceptFrndRequest,
  getMyFrnds,
  getMyNotifications,
  getProfile,
  login,
  logout,
  newUser,
  search,
  sendRequest,
} from "../controllers/user.js";
import { singleAvtar } from "../middlewares/multer.js";
import { isAuthenticate } from "../middlewares/auth.js";
import {
  registerValidator,
  loginValidator,
  validateHandler,
  sendRequestValidator,
  acceptRequestValidator,
} from "../lib/validator.js";
const app = express.Router();
app.post("/new", singleAvtar, registerValidator(), validateHandler, newUser);
app.post("/login", loginValidator(), validateHandler, login);
//Authenticate Routes
app.use(isAuthenticate);
app.get("/profile", getProfile);
app.get("/logout", logout);
app.get("/search", search);
app.put("/sendrequest", sendRequestValidator(), validateHandler, sendRequest);
app.put(
  "/acceptfrndrequest",
  acceptRequestValidator(),
  validateHandler,
  acceptFrndRequest
);
app.get("/getmynotifications", getMyNotifications);
app.get("/getMyFrnds", getMyFrnds);

export default app;
