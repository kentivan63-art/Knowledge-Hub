import express from "express";
import { Post } from "../db/posts.js";
import { User } from "../db/users.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Get all published posts (for blog page)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.findAllPublished();
    res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Get user's posts (must be before /:id)
router.get("/my-posts", requireAuth, async (req, res) => {
  try {
    const posts = await Post.findByAuthor(req.session.userId);
    res.json(posts);
  } catch (error) {
    console.error("Get my posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Create new post
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const authorName = `${user.first_name} ${user.last_name}`;
    const postId = await Post.create({
      title,
      content,
      excerpt: excerpt || `${content.substring(0, 150)}...`,
      authorId: req.session.userId,
      authorName,
      category,
      tags,
      status,
    });

    if (status === "published") {
      await User.update(user.id, { totalPosts: user.total_posts + 1 });
    }

    const post = await Post.findById(postId);
    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get single post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await Post.incrementViews(post.id);
    post.views += 1;

    res.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Update post
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.author_id !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized to update this post" });
    }

    const { title, content, excerpt, category, tags, status } = req.body;
    const updated = await Post.update(post.id, {
      title,
      content,
      excerpt,
      category,
      tags,
      status,
    });

    res.json(updated);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Delete post
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.author_id !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await Post.delete(post.id);

    if (post.status === "published") {
      const user = await User.findById(req.session.userId);
      if (user) {
        await User.update(user.id, {
          totalPosts: Math.max(0, user.total_posts - 1),
        });
      }
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
