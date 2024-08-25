import { TryCatch } from "../middlewares/error.js";
import { Errorhandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { emitEvent } from "../utils/feature.js";
import { ALERT, REFETCH_CHATS } from "../constants/event.js";
import { User } from "../models/user.js";
import { getOtherMembers } from "../lib/helper.js";

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
  emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);
  return res.status(201).json({
    success: true,
    message: "created",
  });
});

const getMyChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user }).populate(
    "members",
    "name avtar"
  );
  console.log(req.user);
  const transFormedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMembers(members, req.user);
    return {
      _id,
      groupChat,
      avtar: groupChat
        ? members.slice(0, 3).map(({ avtar }) => avtar.url)
        : [otherMember.avtar.url],
      name: groupChat ? name : otherMember.name,
      members: members.reduce((previous, current) => {
        if (current._id.toString() !== req.user.toString()) {
          previous.push(current._id);
        }
        return previous;
      }, []),
    };
  });

  return res.status(201).json({
    success: true,
    chats: transFormedChats,
  });
});

const getmyGroups = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({
    members: req.user,
    groupChat: true,
    creator: req.user,
  }).populate("members", "name avtar");
  console.log();
  const groups = chats.map(({ members, _id, groupChat, name }) => ({
    _id,
    groupChat,
    name,
    avtar: members.slice(0, 3).map(({ avtar }) => avtar.url),
  }));
  return res.status(200).json({
    success: true,
    groups,
  });
});

const addMembers = TryCatch(async (req, res, next) => {
  const { chatId, members } = req.body;
  if (!members || members.length < 1) {
    return next(new Errorhandler("Please select member to be add", 400));
  }
  const chats = await Chat.findById(chatId);
  if (!chats) {
    return next(new Errorhandler("Chat not found", 400));
  }
  if (!chats.groupChat) {
    return next(new Errorhandler("This is not a groupchat", 400));
  }
  if (chats.creator.toString() !== req.user.toString()) {
    return next(new Errorhandler("You are not allowed to add members", 403));
  }

  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));
  const allNewMembers = await Promise.all(allNewMembersPromise);
  const uniqueMembers = allNewMembers
    .filter((i) => !chats.members.includes(i._id.toString()))
    .map((i) => i._id);
  chats.members.push(...uniqueMembers);
  if (chats.length > 100) {
    return next(new Errorhandler("Group member reached limit", 400));
  }
  await chats.save();
  const allUserName = allNewMembers.map((i) => i.name).join(",");
  emitEvent(
    req,
    ALERT,
    chats.member,
    `${allUserName} has been added in the group`
  );
  emitEvent(req, REFETCH_CHATS, chats.members);
  return res.status(200).json({
    success: true,
    message: "members added successfully",
  });
});

const removeMembers = TryCatch(async (req, res, next) => {
  const {chatId, userId} = req.body;
  const [chat, userThatWillBeRemoved] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name"),
  ]);
  if (!chat) {
    return next(new Errorhandler("Chat not found", 400));
  }
  if (!chat.groupChat) {
    return next(new Errorhandler("This is not a groupchat", 400));
  }
  if (chat.creator.toString() !== req.user.toString()) {
    return next(new Errorhandler("You are not allowed to add members", 403));
  }
  if (chat.members.length <= 3) {
    return next(new Errorhandler("Group must have 3 members", 403));
  }
  const newMembers = chat.members.filter((i)=>i.toString() !== userId.toString() );
  console.log("ok");
  chat.members = newMembers;
  console.log("ok");
  await chat.save()
  emitEvent(req,ALERT,chat.members,`${userThatWillBeRemoved.name}has been removed from the group`)
  emitEvent(req,REFETCH_CHATS,chat.members);
  return res.status(200).json({
    success:true,
    message:"Member removed"
  })
});

export { newGroupChat, getMyChats, getmyGroups, addMembers, removeMembers };
