import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";

const allUsers = TryCatch(async (req, res) => {
  const user = await User.find({});
  const transformUser = await Promise.all(
    user.map(async ({ name, username, avtar, _id }) => {
      const [groups, friends] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);
      return {
        name,
        username,
        _id,
        avtar: avtar.url,
        groups,
        friends,
      };
    })
  );
  return res.status(200).json({
    success: true,
    transformUser,
  });
});

const allChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({})
    .populate("members", "name avtar")
    .populate("creator", "name avtar");
  const transFormedChats = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });
      return {
        _id,
        groupChat,
        name,
        avtar: members.slice(0, 3).map((member) => member.avtar.url),
        members: members.map(({ _id, name, avtar }) => ({
          _id,
          name,
          avtar: avtar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avtar: creator?.avtar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );
  return res.status(200).json({
    success: true,
    transFormedChats,
  });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .populate("chat", "groupChat")
    .populate("sender", "name avtar");
  const transFormedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat._id,
      groupChat: chat.groupChat,
      sender: {
        _id: sender._id,
        name: sender.name,
        avtar: sender.avtar.url,
      },
    })
  );
  return res.status(200).json({
    success: true,
    transFormedMessages,
  });
});

const getDashboardStats = TryCatch(async (req, res) => {
  const [groupCount, messageCount, chatCount, userCount] = await Promise.all([
    Chat.countDocuments({ groupChat: true }),
    Message.countDocuments(),
    Chat.countDocuments(),
    User.countDocuments(),
  ]);
  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");
  const count = {
    groupCount,
    messageCount,
    chatCount,
    userCount,
    singleUserChatCount: chatCount - groupCount,
  };
  const messages = new Array(7).fill(0);
  const dayInMiliSeconds = 1000 * 60 * 60 * 24;
  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliSeconds;
      const index = Math.floor(indexApprox);
      messages[6-index]++;
  });
  return res.status(200).json({
    success: true,
    count,
    messages,
  });
});

export { allUsers, allChats, allMessages, getDashboardStats };
