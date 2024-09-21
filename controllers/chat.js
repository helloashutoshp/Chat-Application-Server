import { TryCatch } from "../middlewares/error.js";
import { Errorhandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { deleteChatFromCloudnary, emitEvent } from "../utils/feature.js";
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/event.js";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";

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
  // if (!members || members.length < 1) {
  //   return next(new Errorhandler("Please select member to be add", 400));
  // }
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
  const { chatId, userId } = req.body;
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
  const newMembers = chat.members.filter(
    (i) => i.toString() !== userId.toString()
  );
  chat.members = newMembers;
  await chat.save();
  emitEvent(
    req,
    ALERT,
    chat.members,
    `${userThatWillBeRemoved.name}has been removed from the group`
  );
  emitEvent(req, REFETCH_CHATS, chat.members);
  return res.status(200).json({
    success: true,
    message: "Member removed",
  });
});

const leaveGroup = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new Errorhandler("Chat not found", 400));
  }
  if (!chat.groupChat) {
    return next(new Errorhandler("This is not a groupchat", 400));
  }
  const remainUsers = chat.members.filter(
    (member) => member.toString() !== req.user.toString()
  );
  console.log(remainUsers);
  if (chat.creator.toString() == req.user.toString()) {
    const randomElement = Math.floor(Math.random() * remainUsers.length);
    const newCreator = remainUsers[randomElement];
    chat.creator = newCreator;
  }
  const user = await User.findById(req.user, "name");
  console.log(user.name);
  chat.members = remainUsers;

  await chat.save();
  emitEvent(req, ALERT, chat.member, `${user.name} user left the group`);
  emitEvent(req, REFETCH_CHATS, chat.members);
  return res.status(200).json({
    success: true,
    message: "Member removed",
  });
});

const sendAttachments = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;
  const files = req.files || [];
  if (files.length < 1) {
    return next(new Errorhandler("Please upload a file", 400));
  }
  if (files.length > 5) {
    return next(new Errorhandler("Maximun file upload is 5", 400));
  }
  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name"),
  ]);
  if (!chat) {
    return next(new Errorhandler("Chat not found", 400));
  }

  const attachments = [];
  const messageForDB = {
    content: "",
    attachments,
    sender: req.user,
    chat: chatId,
  };
  const messageRealTime = {
    ...messageForDB,
    sender: {
      _id: req.user,
      name: me.name,
    },
  };
  const message = await Message.create(messageForDB);
  emitEvent(req, NEW_ATTACHMENT, chat.members, {
    message: messageRealTime,
    chatId,
  });
  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
  return res.status(200).json({
    sucess: true,
    message,
  });
});

const getChatDetails = TryCatch(async (req, res, next) => {
  if (req.query.populate === "true") {
    const chat = await Chat.findById(req.params.id)
      .populate("members", "name avtar")
      .lean();
    if (!chat) {
      return next(new Errorhandler("Chat not found", 400));
    }
    chat.members = chat.members.map(({ _id, name, avtar }) => ({
      _id,
      name,
      avtar: avtar.url,
    }));
    console.log(chat);
    return res.status(200).json({
      sucess: true,
      chat,
    });
  } else {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return next(new Errorhandler("Chat not found", 400));
    }
    return res.status(200).json({
      sucess: true,
      chat,
    });
  }
});

const changeGroupName = TryCatch(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  const { name } = req.body;
  if (!chat) {
    return next(new Errorhandler("Chat not found", 400));
  }
  if (!chat.groupChat) {
    return next(new Errorhandler("This is not a groupchat", 400));
  }
  if (req.user.toString() !== chat.creator.toString()) {
    return next(
      new Errorhandler("You have no permit to change the group name", 400)
    );
  }
  chat.name = name;
  await chat.save();
  emitEvent(req, REFETCH_CHATS, chat.members);
  return res.status(200).json({
    success: true,
    message: "Group name changed",
  });
});

const deleteChat = TryCatch(async (req, res, next) => {
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new Errorhandler("Chat not found", 400));
  }
  if (!chat.groupChat) {
    return next(new Errorhandler("This is not a groupchat", 400));
  }
  if (chat.creator.toString() !== req.user.toString()) {
    return next(new Errorhandler("You have no permit to delete the chat", 400));
  }
  if (!chat.groupChat && !chat.members.include(req.user.toString())) {
    return next(new Errorhandler("You are not the member of this group", 400));
  }

  const messageWithAttachments = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });
  const public_ids = [];
  messageWithAttachments.forEach(({ attachments }) =>
    attachments.foreach(({ public_id }) => public_ids.push(public_id))
  );
  await Promise.all([
    deleteChatFromCloudnary(public_ids),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);
  emitEvent(req, REFETCH_CHATS, chat.members);
  return res.status(200).json({
    success: true,
    message: "Chat deleted successfully",
  });
});

const getMessage = TryCatch(async (req, res) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;
  const resultPerPage = 5;
  const skip = (page - 1) * resultPerPage;
  const [messages, totalMessageCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate("sender", "name avtar")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);
  const totalMessage = Math.ceil(totalMessageCount / resultPerPage);
  return res.status(200).json({
    success: true,
    message: messages.reverse(),
    page: totalMessage,
  });
});
export {
  newGroupChat,
  getMyChats,
  getmyGroups,
  addMembers,
  removeMembers,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  changeGroupName,
  deleteChat,
  getMessage,
};
