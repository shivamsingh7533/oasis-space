import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken'; // <--- IMPORT THIS

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return next(new Error("All fields are required"));
  }
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  try {
    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully!" });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // 1. Check User
    const validUser = await User.findOne({ email });
    if (!validUser) return next({ statusCode: 404, message: "User not found!" });

    // 2. Check Password
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next({ statusCode: 401, message: "Wrong credentials!" });

    // 3. Create Token (The "ID Card")
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

    // 4. Remove password from the data we send back (for security)
    const { password: pass, ...rest } = validUser._doc;

    // 5. Send Cookie + User Data
    res
      .cookie('access_token', token, { httpOnly: true })
      .status(200)
      .json(rest);

  } catch (error) {
    next(error);
  }
};
export const signout = async (req, res, next) => {
  try {
    res.clearCookie('access_token');
    res.status(200).json('User has been signed out!');
  } catch (error) {
    next(error);
  }
};