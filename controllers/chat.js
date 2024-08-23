import { TryCatch } from "../middlewares/error.js";
import { Errorhandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { emitEvent } from "../utils/feature.js";
import { ALERT, REFETCH_CHATS } from "../constants/event.js";

const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;
  if (members.length < 2) {
    return next(new Errorhandler("GroupChat must have 3 members", 400));
  }

  const allMembers = [...members, req.user];
  await Chat.create({
    name,
    groupChat: true,
    members: allMembers,
    creator: req.user,
  });
  emitEvent(req,ALERT,allMembers,`Welcome to ${name} group`);
  emitEvent(req,REFETCH_CHATS,members);
  return res.status(201).json({
    success:true,
    message:"created"
  })
});

export { newGroupChat };
