import User from '../models/User.js';

// @desc    Search users by name or username
// @route   GET /api/users/search?q=query
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    const currentUserId = req.user._id;

    if (!query) {
      // Return recent or suggested users if query is empty
      const users = await User.find({ _id: { $ne: currentUserId } })
        .select('-password')
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
      $or: [{ username: regex }, { fullName: regex }, { email: regex }]
    })
      .select('-password')
      .limit(30);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
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
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password')
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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
