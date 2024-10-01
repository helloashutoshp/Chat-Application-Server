import { User } from "../models/user.js";
import { Errorhandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import jwt from 'jsonwebtoken';
const isAuthenticate = (req,res,next) => {
  const token  = req.cookies['alochana-token'];
  if(!token){
    return next(new Errorhandler('You have no authentication to use this page',401))
  }
  const decodeToken = jwt.verify(token,process.env.JWT_SECRET);
  req.user = decodeToken._id;
  next();
}

const isAdmin = (req,res,next) => {
  const token  = req.cookies['admin-secret-key'];
  if(!token){
    return next(new Errorhandler('Tu admin nahi he',401))
  }
  const decodeToken = jwt.verify(token,process.env.JWT_SECRET);
  // const adminSecretkey = process.env.ADMIN_SECRET_KEY;
  // const isMatch = secretKey == adminSecretkey;
  // if (!isMatch) {
  //   return next(new Errorhandler("Invalid Crendential", 401));
  // }
  next();
}

const socketAuthenticate = async(err,socket, next,) => {
try {
  if(err) return next(err);
  const authToken = socket.request.cookies['alochana-token'];
  if(!authToken){
    return next(new Errorhandler("Please login to access this route",401));
  }
  const docodeData = jwt.verify(authToken,process.env.JWT_SECRET);
  const user = await User.findById(docodeData._id);
  if(!user){
    return next(new Errorhandler("Please login to access this route",401));
  }
  socket.user = user;
  return next();

  
} catch (error) {
  console.log(error);
  return next(new Errorhandler("Please login to access route",401));
}
}

export {isAuthenticate,isAdmin,socketAuthenticate};