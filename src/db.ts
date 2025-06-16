import Database from "bun:sqlite";
const db = new Database("posts.db", { create: true });

export { db };
