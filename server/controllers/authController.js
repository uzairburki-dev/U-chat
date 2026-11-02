import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/emailService.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtkey_chatboat_2026_modern_live_chat',
    { expiresIn: '30d' }
  );
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user & send email OTP
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName, avatar, bio } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (username, email, password, full name)'
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      // If user exists and is already verified, prevent duplicate
      if (existingUser.isEmailVerified) {
        const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
        return res.status(400).json({
          success: false,
          message: `${field} is already in use by an active account`
        });
      }

      // If user exists but is unverified, update their details and send new OTP
      existingUser.username = username.toLowerCase();
      existingUser.fullName = fullName;
      existingUser.password = password; // Will be hashed by pre-save
      existingUser.emailOtp = otp;
      existingUser.emailOtpExpires = otpExpires;
      if (avatar) existingUser.avatar = avatar;
      if (bio) existingUser.bio = bio;
      await existingUser.save();

      await sendOtpEmail(existingUser.email, otp, existingUser.fullName);

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: existingUser.email,
        message: 'Verification code sent to your email',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    const defaultAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      avatar: defaultAvatar,
      bio: bio || 'Hey there! I am using ChatBoat.',
      isEmailVerified: false,
      emailOtp: otp,
      emailOtpExpires: otpExpires
    });

    await sendOtpEmail(newUser.email, otp, newUser.fullName);

    res.status(201).json({
      success: true,
      requireVerification: true,
      email: newUser.email,
      message: 'Verification code sent to your email address',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify email address using OTP
// @route   POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and 6-digit verification code'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found for this email address'
      });
    }

    if (user.isEmailVerified) {
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          user: user.toSafeObject(),
          token
        }
      });
    }

    if (!user.emailOtp || user.emailOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.'
      });
    }

    if (!user.emailOtpExpires || user.emailOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to ChatBoat.',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resend email verification code
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already verified'
      });
    }

    const otp = generateOtp();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOtpEmail(user.email, otp, user.fullName);

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    const query = login.includes('@')
      ? { email: login.toLowerCase() }
      : { username: login.toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      const otp = generateOtp();
      user.emailOtp = otp;
      user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, otp, user.fullName);

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Your email address is not verified yet. We have sent a verification code to your email.',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    // Update status to online
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, status, customStatus, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (status && ['online', 'offline', 'away', 'busy'].includes(status)) {
      user.status = status;
    }
    if (customStatus !== undefined) user.customStatus = customStatus.trim();
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logoutUser = async (req, res) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date();
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
