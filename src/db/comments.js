import { query, queryOne, execute } from "./index.js";

export const Comment = {
  async findByPost(postId) {
    const result = await query(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
      [postId]
    );
    return result.results.map((row) => ({
      ...row,
      _id: row.id,
      user: row.user_id,
      userName: row.user_name,
    }));
  },

  async create({ postId, userId, userName, content }) {
    const result = await execute(
      "INSERT INTO comments (post_id, user_id, user_name, content) VALUES (?, ?, ?, ?)",
      [postId, userId || null, userName, content]
    );
    return result.meta.last_row_id;
  },

  async delete(id) {
    await execute("DELETE FROM comments WHERE id = ?", [id]);
  },
};
