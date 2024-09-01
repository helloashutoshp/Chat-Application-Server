import express from "express";
import { isAuthenticate } from "../middlewares/auth.js";
import {
  getmyGroups,
  getMyChats,
  newGroupChat,
  addMembers,
  removeMembers,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  changeGroupName,
  deleteChat,
  getMessage,
} from "../controllers/chat.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import {
  addMemberValidator,
  changeGroupNameValidator,
  groupChatValidator,
  leaveGroupvalidator,
  removeMemberValidator,
  sendAttachmentsValidator,
  validateHandler,
} from "../lib/validator.js";
const app = express.Router();
app.use(isAuthenticate);
app.post("/new", groupChatValidator(), validateHandler, newGroupChat);
app.get("/my", getMyChats);
app.get("/my/groupChat", getmyGroups);
app.put("/addMembers", addMemberValidator(), validateHandler, addMembers);
app.put(
  "/removemembers",
  removeMemberValidator(),
  validateHandler,
  removeMembers
);
app.delete("/leave/:id", leaveGroup);
app.post(
  "/message",
  attachmentsMulter,
  sendAttachmentsValidator(),
  validateHandler,
  sendAttachments
);
app
  .route("/:id")
  .get(getChatDetails)
  .put(changeGroupNameValidator(), validateHandler, changeGroupName)
  .delete(deleteChat);
app.get("/message/:id", getMessage);
export default app;
