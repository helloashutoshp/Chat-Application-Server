import { TryCatch } from "../middlewares/error";
import { Errorhandler } from "../utils/utility";
import { Chat } from "../models/chat.js";

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
});

export { newGroupChat };
