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
    const { username, email, password, fullName, avatar, bio } = req.body || {};

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (username, email, password, full name)'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    // Username format and length validation
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    if (cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username cannot exceed 30 characters'
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, periods, and dashes'
      });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Separate lookups for email and username to handle duplicates with clear error messages
    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email: cleanEmail }),
      User.findOne({ username: cleanUsername })
    ]);

    // Check if email belongs to an already verified account
    if (existingByEmail && existingByEmail.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use by an active account. Please sign in or use a different email.'
      });
    }

    // Check if username belongs to an already verified account
    if (existingByUsername && existingByUsername.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose a different username.'
      });
    }

    // If username is taken by a different unverified account
    if (
      existingByUsername &&
      existingByEmail &&
      existingByUsername._id.toString() !== existingByEmail._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Username is already in use by another registration. Please choose another username.'
      });
    }

    if (existingByUsername && !existingByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose another username.'
      });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const defaultAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`;

    // If user exists with this email but is unverified, update their registration details and send new OTP
    if (existingByEmail) {
      existingByEmail.username = cleanUsername;
      existingByEmail.fullName = cleanFullName;
      existingByEmail.password = password; // Hashed by pre-save
      existingByEmail.emailOtp = otp;
      existingByEmail.emailOtpExpires = otpExpires;
      if (avatar) existingByEmail.avatar = avatar;
      if (bio !== undefined) existingByEmail.bio = bio.trim();

      await existingByEmail.save();
      await sendOtpEmail(existingByEmail.email, otp, existingByEmail.fullName);

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: existingByEmail.email,
        message: 'A verification code has been sent to your email address.',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    // Brand new user registration
    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password,
      fullName: cleanFullName,
      avatar: defaultAvatar,
      bio: bio ? bio.trim() : 'Hey there! I am using ChatBoat.',
      isEmailVerified: false,
      emailOtp: otp,
      emailOtpExpires: otpExpires
    });

    await sendOtpEmail(newUser.email, otp, newUser.fullName);

    return res.status(201).json({
      success: true,
      requireVerification: true,
      email: newUser.email,
      message: 'Verification code sent to your email address.',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Registration processing exception:', error.name, error.message);

    // MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
      const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(400).json({
        success: false,
        message: `${capitalizedField} is already registered. Please choose another.`
      });
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration could not be completed. Please check your details and try again.'
    });
  }
};

// @desc    Verify email address using OTP
// @route   POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and 6-digit verification code'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail });

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

    if (!user.emailOtp || user.emailOtp !== cleanOtp) {
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

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to ChatBoat.',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    console.error('Email verification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Verification process failed. Please try again.'
    });
  }
};

// @desc    Resend email verification code
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

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

    return res.status(200).json({
      success: true,
      message: 'New verification code sent to your email',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not resend verification code. Please try again later.'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    const cleanLogin = login.trim().toLowerCase();
    const query = cleanLogin.includes('@')
      ? { email: cleanLogin }
      : { username: cleanLogin };

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

    return res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during sign in. Please try again.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, status, customStatus, avatar } = req.body || {};
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

    return res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
