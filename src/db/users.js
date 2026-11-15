import { query, queryOne, execute } from "./index.js";

export const User = {
  async findById(id) {
    return queryOne("SELECT * FROM users WHERE id = ?", [id]);
  },

  async findByEmail(email) {
    return queryOne("SELECT * FROM users WHERE email = ?", [email]);
  },

  async findByUsername(username) {
    return queryOne("SELECT * FROM users WHERE username = ?", [username]);
  },

  async create({ firstName, lastName, username, email, password }) {
    const result = await execute(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, password]
    );
    return result.meta.last_row_id;
  },

  async update(id, fields) {
    const columnMap = {
      firstName: "first_name",
      lastName: "last_name",
      username: "username",
      email: "email",
      password: "password",
      totalViews: "total_views",
      totalPosts: "total_posts",
      followers: "followers",
    };
    const entries = Object.entries(fields).filter(([k]) => columnMap[k]);
    if (entries.length === 0) return this.findById(id);
    const setClause = entries.map(([k]) => `${columnMap[k]} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    await execute(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
    return this.findById(id);
  },

  async delete(id) {
    await execute("DELETE FROM users WHERE id = ?", [id]);
  },
};
