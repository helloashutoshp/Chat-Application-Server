import { compare } from "bcrypt";
import { User } from "../models/user.js";
import { cookieOptions, sendToken } from "../utils/feature.js";
import { TryCatch } from "../middlewares/error.js";
import { Errorhandler } from "../utils/utility.js";

const newUser = async (req, res) => {
  const { name, password, bio, username } = req.body;
  console.log(req.body);

  const avtar = {
    public_id: "jdnn",
    url: "mnj",
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
  sendToken(res, user, 201, "Success");
};
const login = TryCatch( async (req,res,next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).select("+password");
  if (!user) return next(new Errorhandler("Invalid Credential",404));
  const isMatch = await compare(password, user.password);
  if (!isMatch) return next(new Errorhandler("Invalid Credential",404));
  sendToken(res, user, 201, `welcome ${user.name}`);
});
const getProfile = TryCatch(async(req,res) => {
  const user =  await User.findById(req.user);
   res.status(200).json({
    success:true,
    user
   })
});
const logout = TryCatch(async(req,res) => {
   res.status(200).cookie('alochana-token',"",{...cookieOptions,maxAge:0}).json({
    success:true,
    message:"Loged out Successfully"
   })
});
const search = TryCatch(async(req,res) => {
   const {name} = req.query;
  res.status(200).json({
   success:true,
   message:name
  })
});
export { login, newUser,getProfile,logout,search };
