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

export {isAuthenticate,isAdmin};