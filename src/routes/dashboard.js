import express from "express";
import { User } from "../db/users.js";
import { Post } from "../db/posts.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Get dashboard stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalPosts = await Post.countPublishedByAuthor(user.id);
    const totalViews = await Post.sumViewsByAuthor(user.id);

    res.json({
      totalViews,
      totalPosts,
      followers: user.followers,
      userName: `${user.first_name} ${user.last_name}`,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
