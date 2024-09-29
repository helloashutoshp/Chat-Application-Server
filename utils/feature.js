import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64 } from "../lib/helper.js";
const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};
const connectDb = (uri) => {
  mongoose
    .connect(uri, { dbName: "Alochana" })
    .then((data) => console.log(`Connect to Db :${data.connection.host} `))
    .catch((err) => {
      console.log("hello I am", err);
      throw err;
    });
};

const fileUploadToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadPromises);
    console.log(results);
    const formatresults = results.map((result) => ({
      public_id:result.public_id,
      url:result.secure_url
    }));
    return formatresults;
  } catch (error) {
    console.log("error is ",error)
  }
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  return res.status(code).cookie("alochana-token", token, cookieOptions).json({
    success: true,
    message,
  });
};

const emitEvent = (req, event, user, data) => {
  console.log("Emiting event", event);
};

const deleteChatFromCloudnary = async (public_id) => {};
export {
  connectDb,
  sendToken,
  cookieOptions,
  emitEvent,
  deleteChatFromCloudnary,
  fileUploadToCloudinary,
};
