import { User } from "../models/user.js";
import { sendToken } from "../utils/feature.js";

const newUser = async (req, res) => {
  const {name,password,bio,username} = req.body;
  console.log(req.body);

  const avtar = {
    public_id: "jdnn",
    url: "mnj",
  };

  const existingUser = await User.findOne({username : username});
  console.log("existingUser : ", existingUser);
  
  if(existingUser){
    return res.status(404).json({
      message: "User Alredy exists",
      Status : 404
    })
  }

  const user = await User.create({
    name,
    username,
    password,
    avtar,
    bio 
  });
  // sendToken(req,201,user,"Created Successfully");
  sendToken(res,user,201,"Success")
};
const login = (req, res) => {
  res.send("maa ki chut");
};
export { login, newUser };
