import { TryCatch } from "../middlewares/error.js";
import { Errorhandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { emitEvent } from "../utils/feature.js";
import { ALERT, REFETCH_CHATS } from "../constants/event.js";
import { User } from "../models/user.js";

const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;
  if (members.length < 2) {
    return next(new Errorhandler("GroupChat must have 3 members", 400));
  }

      const validMembers = await Promise.all(
        members.map(async (memberId) => {
          const user = await User.findById(memberId);
          return user !== null; 
        })
      );
  

  if (validMembers.includes(false)) {
    return next(new Errorhandler("One or more members do not exist", 404));
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
