import { body, check, param, validationResult } from "express-validator";
import { Errorhandler } from "../utils/utility.js";
const validateHandler = (req, res, next) => {
  const errors = validationResult(req);
  const errorMessage = errors
    .array()
    .map((error) => error.msg)
    .join(",");
  if (errors.isEmpty()) {
    return next();
  } else {
    return next(new Errorhandler(errorMessage, 400));
  }
};
const registerValidator = () => [
  body("name", "Please enter your name").notEmpty(),
  body("username", "Please enter username").notEmpty(),
  body("bio", "Please enter bio").notEmpty(),
  body("password", "Please enter your password").notEmpty(),
  check("avtar", "Please upload your avtar").notEmpty(),
];
const loginValidator = () => [
  body("username", "Please enter username").notEmpty(),
  body("password", "Please enter your password").notEmpty(),
];
const groupChatValidator = () => [
  body("name", "Please enter group name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please add members")
    .isArray({ min: 2, max: 100 })
    .withMessage("Member must be 2 to 100"),
];

const addMemberValidator = () => [
  body("chatId", "Please enter chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please add members")
    .isArray({ min: 2, max: 97 })
    .withMessage("Please add atleast two member"),
];

const removeMemberValidator = () => [
  body("chatId", "Please enter chat Id").notEmpty(),
  body("userId", "Please enter userId").notEmpty(),
];

const leaveGroupvalidator = () => [
  console.log("hello"),
  param("id", "Please enter chatId").notEmpty(),
];

const sendAttachmentsValidator = () => [
  body("chatId", "Please enter chat Id").notEmpty(),
  //   check("files")
  //     .notEmpty()
  //     .withMessage("Please upload files")
  //     .isArray({ min: 1, max: 5 })
  //     .withMessage("Please upload minimum 1 and maximun 5 files"),
];

const getMessageValidator = () => [
  param("id", "Please enter chatId").notEmpty(),
];

const changeGroupNameValidator = () => [
  body("name", "Please enter group name").notEmpty(),
];

const sendRequestValidator = () => [
  body("userId", "Please enter userId").notEmpty(),
];

const acceptRequestValidator = () => [
  body("requestId", "Please enter requestId").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add accept")
    .isBoolean()
    .withMessage("Accept must be a boolean"),
];
export {
  registerValidator,
  validateHandler,
  loginValidator,
  groupChatValidator,
  addMemberValidator,
  removeMemberValidator,
  leaveGroupvalidator,
  sendAttachmentsValidator,
  getMessageValidator,
  changeGroupNameValidator,
  sendRequestValidator,
  acceptRequestValidator
};
