const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');

// Get all published posts (for blog page)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'firstName lastName username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get user's posts
router.get('/my-posts', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.session.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new post
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status } = req.body;
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const post = new Post({
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      author: req.session.userId,
      authorName: `${user.firstName} ${user.lastName}`,
      category: category || 'General',
      tags: tags || [],
      status: status || 'draft'
    });

    await post.save();

    // Update user's post count
    if (status === 'published') {
      user.stats.totalPosts += 1;
      await user.save();
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName username');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Update post
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { title, content, excerpt, category, tags, status } = req.body;
    
    post.title = title || post.title;
    post.content = content || post.content;
    post.excerpt = excerpt || post.excerpt;
    post.category = category || post.category;
    post.tags = tags || post.tags;
    post.status = status || post.status;

    await post.save();
    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    // Update user's post count
    const user = await User.findById(req.session.userId);
    if (user && post.status === 'published') {
      user.stats.totalPosts = Math.max(0, user.stats.totalPosts - 1);
      await user.save();
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
