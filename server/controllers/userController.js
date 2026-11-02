import User from '../models/User.js';

// @desc    Search users by name or username
// @route   GET /api/users/search?q=query
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    const currentUserId = req.user._id;

    if (!query) {
      // Return active verified users
      const users = await User.find({
        _id: { $ne: currentUserId },
        isEmailVerified: { $ne: false }
      })
        .select('-password -emailOtp -emailOtpExpires')
        .limit(20)
        .sort({ updatedAt: -1 });

      return res.status(200).json({
        success: true,
        data: users
      });
    }

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      _id: { $ne: currentUserId },
      isEmailVerified: { $ne: false },
      $or: [{ username: regex }, { fullName: regex }, { email: regex }]
    })
      .select('-password -emailOtp -emailOtpExpires')
      .limit(30);

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users (directory)
// @route   GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({
      _id: { $ne: currentUserId },
      isEmailVerified: { $ne: false }
    })
      .select('-password -emailOtp -emailOtpExpires')
      .sort({ fullName: 1 });

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -emailOtp -emailOtpExpires');
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
