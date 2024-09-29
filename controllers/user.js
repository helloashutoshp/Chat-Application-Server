import { compare } from "bcrypt";
import { User } from "../models/user.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import {
  cookieOptions,
  emitEvent,
  fileUploadToCloudinary,
  sendToken,
} from "../utils/feature.js";
import { TryCatch } from "../middlewares/error.js";
import { Errorhandler } from "../utils/utility.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMembers } from "../lib/helper.js";

const newUser = TryCatch(async (req, res, next) => {
  const { name, password, bio, username } = req.body;
  // console.log(req.body);
  const file = req.file;
  // console.log('file',file);
  if (!file) {
    return next(new Errorhandler("Please upload avtar", 400));
  }
  const result = await fileUploadToCloudinary([file]);
  console.log(result);
  const avtar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const existingUser = await User.findOne({ username: username });

  if (existingUser) {
    return res.status(404).json({
      message: "User Alredy exists",
      Status: 404,
    });
  }

  const user = await User.create({
    name,
    username,
    password,
    avtar,
    bio,
  });
  sendToken(res, user, 201, "Signed In Successfully");
});
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).select("+password");
  if (!user) return next(new Errorhandler("Invalid Credential", 404));
  const isMatch = await compare(password, user.password);
  if (!isMatch) return next(new Errorhandler("Invalid Credential", 404));
  sendToken(res, user, 201, `welcome ${user.name}`);
});
const getProfile = TryCatch(async (req, res) => {
  console.log(req.user);
  const user = await User.findById(req.user);
  res.status(200).json({
    success: true,
    user,
  });
});
const logout = TryCatch(async (req, res) => {
  res
    .status(200)
    .cookie("alochana-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Loged out Successfully",
    });
});

const search = TryCatch(async (req, res) => {
  const { name = "" } = req.query;
  const myChats = await Chat.find({ groupChat: false, members: req.user });
  const allUserFromChats = myChats.map((chat) => chat.members).flat();
  const allUserexceptMeandFrnd = await User.find(
      {
        _id: { $nin: allUserFromChats },
        name: { $regex: name, $options: "i" },
      }
    );
    const user = allUserexceptMeandFrnd.map(({ _id, name, avtar }) => (
      {
        _id,
        name,
        avtar: avtar.url,
      }
    ));

    res.status(200).json({
      success: true,
      users: user,
    });
  }
);

const sendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;
  const request = await Request.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });
  if (request) {
    return next(new Errorhandler("Request already sent", 400));
  }
  await Request.create({
    sender: req.user,
    receiver: userId,
  });
  emitEvent(req, NEW_REQUEST, [userId]);
  return res
    .status(200)
    .json({ success: true, message: "Request send successfully" });
});
const acceptFrndRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;
  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");
  console.log(request);
  if (!request) {
    return next(new Errorhandler("Request not found", 404));
  }
  if (request.receiver._id.toString() !== req.user.toString()) {
    return next(
      new Errorhandler("You are not authorized to accept the request", 404)
    );
  }
  if (!accept) {
    await request.deleteOne();
    res.status(200).json({
      success: true,
      message: "Friend request rejected",
    });
  }
  console.log(request.sender);
  console.log(request.receiver);

  const members = [request.sender._id, request.receiver.id];
  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);
  emitEvent(req, REFETCH_CHATS, members);
  res.status(200).json({
    success: true,
    message: "Freind requesr accepted",
    sender_id: request.sender,
  });
});
const getMyNotifications = TryCatch(async (req, res, next) => {
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender",
    "name avtar"
  );
  const allRequest = requests.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avtar: sender.avtar.url,
    },
  }));
  res.status(200).json({
    success: true,
    allRequest,
  });
});
const getMyFrnds = TryCatch(async (req, res, next) => {
  const chatId = req.query.chatId;
  const chats = await Chat.find({
    members: req.user,
    groupChat: false,
  }).populate("members", "name avtar");
  // console.log(chats);

  const friends = chats.map(({ members }) => {
    const otherUser = getOtherMembers(members, req.user);
    return {
      _id: otherUser._id,
      name: otherUser.name,
      avtar: otherUser.avtar.url,
    };
  });
  if (chatId) {
    const chat = await Chat.findById(chatId);
    const availableFrnd = friends.filter(
      (friend) => !chat.members.includes(friend._id)
    );
    return res.status(200).json({
      sucess: true,
      friends: availableFrnd,
    });
  } else {
    return res.status(200).json({
      sucess: true,
      friends,
    });
  }
});
export {
  login,
  newUser,
  getProfile,
  logout,
  search,
  sendRequest,
  acceptFrndRequest,
  getMyNotifications,
  getMyFrnds,
};
