import { compare } from "bcrypt";
import { User } from "../models/user.js";
import { sendToken } from "../utils/feature.js";

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
const login = async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  const user = await User.findOne({ username }).select("+password");
  if (!user) return res.status(400).json({ message: "Invalid username" });
  const isMatch = await compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
  sendToken(res, user, 201, `welcome ${user.name}`);
};
export { login, newUser };
