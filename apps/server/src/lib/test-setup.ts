import { beforeAll, afterAll } from "vitest";
import { db } from "../db";

beforeAll(async () => {
  db.exec("DELETE FROM users");
  db.exec("DELETE FROM sessions");
});

afterAll(async () => {
  db.close();
});
