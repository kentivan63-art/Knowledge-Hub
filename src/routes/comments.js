import express from "express";
import { Comment } from "../db/comments.js";
import { Post } from "../db/posts.js";

const router = express.Router({ mergeParams: true });

// Get comments for a post
router.get("/", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const comments = await Comment.findByPost(post.id);
    res.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment (works anonymously or logged in)
router.post("/", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const userName = req.session?.userName || req.body.userName || "Anonymous";
    const commentId = await Comment.create({
      postId: post.id,
      userId: req.session?.userId || null,
      userName,
      content: content.trim(),
    });

    res.status(201).json({ id: commentId, message: "Comment added" });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
