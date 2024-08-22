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
export {isAuthenticate};