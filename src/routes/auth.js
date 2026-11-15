import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../db/users.js";

const router = express.Router();

function publicUser(user, id) {
  return {
    id: id ?? user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    email: user.email,
  };
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const existingUsername = await User.findByUsername(username.toLowerCase());
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    req.session.userId = userId;
    req.session.userName = `${firstName} ${lastName}`;
    await req.session.save();

    res.status(201).json({
      message: "Account created successfully",
      user: publicUser(
        {
          first_name: firstName,
          last_name: lastName,
          username: username.toLowerCase(),
          email: email.toLowerCase(),
        },
        userId
      ),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email?.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    req.session.userName = `${user.first_name} ${user.last_name}`;
    await req.session.save();

    res.json({
      message: "Login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  await req.session.destroy();
  res.clearCookie("sessionId", { path: "/" });
  res.json({ message: "Logout successful" });
});

// Check session
router.get("/check", (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      authenticated: true,
      userId: req.session.userId,
      userName: req.session.userName,
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
