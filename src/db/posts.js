import { query, queryOne, execute } from "./index.js";

function rowToPost(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    authorName: row.author_name,
    author_id: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: safeParseTags(row.tags),
  };
}

function safeParseTags(tags) {
  try {
    return JSON.parse(tags || "[]");
  } catch {
    return [];
  }
}

const POST_SELECT = `
  SELECT p.*, u.first_name, u.last_name, u.username AS author_username
  FROM posts p
  LEFT JOIN users u ON p.author_id = u.id
`;

function withAuthor(row) {
  const post = rowToPost(row);
  if (!post) return null;
  post.author = row.first_name
    ? {
        id: post.author_id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.author_username,
      }
    : null;
  return post;
}

export const Post = {
  async findAllPublished() {
    const result = await query(
      `${POST_SELECT} WHERE p.status = 'published' ORDER BY p.created_at DESC`
    );
    return result.results.map(withAuthor);
  },

  async findByAuthor(authorId) {
    const result = await query(
      `${POST_SELECT} WHERE p.author_id = ? ORDER BY p.created_at DESC`,
      [authorId]
    );
    return result.results.map(withAuthor);
  },

  async findById(id) {
    const row = await queryOne(`${POST_SELECT} WHERE p.id = ?`, [id]);
    return withAuthor(row);
  },

  async create({ title, content, excerpt, authorId, authorName, category, tags, status }) {
    const result = await execute(
      `INSERT INTO posts (title, content, excerpt, author_id, author_name, category, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        excerpt || null,
        authorId,
        authorName,
        category || "General",
        JSON.stringify(tags || []),
        status === "published" ? "published" : "draft",
      ]
    );
    return result.meta.last_row_id;
  },

  async update(id, fields) {
    const columnMap = {
      title: "title",
      content: "content",
      excerpt: "excerpt",
      category: "category",
      views: "views",
      likes: "likes",
      status: "status",
    };
    const entries = [];
    for (const [key, column] of Object.entries(columnMap)) {
      if (fields[key] !== undefined) entries.push([column, fields[key]]);
    }
    if (fields.tags !== undefined) {
      entries.push(["tags", JSON.stringify(fields.tags)]);
    }
    if (entries.length > 0) {
      const setClause = entries.map(([c]) => `${c} = ?`).join(", ");
      const values = entries.map(([, v]) => v);
      await execute(
        `UPDATE posts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`,
        [...values, id]
      );
    }
    return this.findById(id);
  },

  async incrementViews(id) {
    await execute("UPDATE posts SET views = views + 1 WHERE id = ?", [id]);
  },

  async delete(id) {
    await execute("DELETE FROM comments WHERE post_id = ?", [id]);
    await execute("DELETE FROM posts WHERE id = ?", [id]);
  },

  async countPublishedByAuthor(authorId) {
    const row = await queryOne(
      "SELECT COUNT(*) AS count FROM posts WHERE author_id = ? AND status = 'published'",
      [authorId]
    );
    return row.count;
  },

  async sumViewsByAuthor(authorId) {
    const row = await queryOne(
      "SELECT COALESCE(SUM(views), 0) AS total FROM posts WHERE author_id = ? AND status = 'published'",
      [authorId]
    );
    return row.total;
  },
};
