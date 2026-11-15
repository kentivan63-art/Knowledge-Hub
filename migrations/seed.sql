-- Seed an admin user. Password is "password123" (bcrypt hash) — change it after first login.
INSERT INTO users (first_name, last_name, username, email, password, followers) VALUES
  ('Admin', 'User', 'admin', 'admin@knowledgehub.com', '$2a$10$Q3blBYLlPiIyGdK3tKMvFuWrbtXYRhLJzixlIi.5HqRHjSTmbAU0C', 0);

-- Seed a sample published post
INSERT INTO posts (title, content, excerpt, author_id, author_name, category, tags, status) VALUES
  ('Welcome to KnowledgeHub', 'This is the first post on our blog platform. KnowledgeHub is built with Cloudflare Workers, D1, and KV.', 'Welcome to our new blog!', 1, 'Admin User', 'General', '["welcome","announcement"]', 'published');
