const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: req.session.userId, status: 'published' });

    // Calculate views (sum of all post views)
    const posts = await Post.find({ author: req.session.userId, status: 'published' });
    const totalViews = posts.reduce((sum, post) => sum + post.views, 0);

    res.json({
      totalViews: totalViews || user.stats.totalViews,
      totalPosts: postCount,
      followers: user.stats.followers,
      userName: `${user.firstName} ${user.lastName}`
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
