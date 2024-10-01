import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { errorMiddleware } from "./middlewares/error.js";
import adminRoute from "./routes/admin.js";
import chatRoute from "./routes/chat.js";
import userRoute from "./routes/user.js";
import { connectDb } from "./utils/feature.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { NEW_MESSAGE } from "./constants/event.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import { log } from "console";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticate } from "./middlewares/auth.js";
dotenv.config({
  path: "./.env",
});
const mongoURI = process.env.MONGO_URI;
const port = process.env.PRO || 3001;
connectDb(mongoURI);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const userSocketIDs = new Map();
// createuser(10);
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);
app.get("/", (req, res) => {
  res.send("hi");
});
io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticate(err, socket, next)
  );
});
io.on("connection", (socket) => {
  // console.log(socket);
  const user = socket.user;
  // console.log("user",user);
  userSocketIDs.set(user._id.toString(), socket.id);
  console.log(userSocketIDs);
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDb = {
      sender: user._id,
      content: message,
      chat: chatId,
    };
    const membersSockets = getSockets(members);
    io.to(membersSockets).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSockets).emit(NEW_MESSAGE, { chatId });
    console.log(messageForRealTime);
    try {
      await Message.create(messageForDb);
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("disconnect", () => {
    console.log("user dissconnected");
  });
});
app.use(errorMiddleware);
server.listen(port, () => {
  console.log(`hello the port is ${port}`);
});

export { userSocketIDs };
