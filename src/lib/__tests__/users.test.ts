import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetUsersForTests,
  countUsers,
  createUserWithPassword,
  findUserByEmail,
  updatePreferences,
  upsertOAuthUser,
  UserError,
  verifyCredentials,
} from "../users";

describe("users store", () => {
  beforeEach(() => __resetUsersForTests());
  afterEach(() => __resetUsersForTests());

  it("creates an account with a bcrypt hash and never leaks it", async () => {
    const user = await createUserWithPassword({ email: "Reader@Example.com", password: "correct horse", name: "Reader" });
    expect(user.id).toMatch(/[0-9a-f-]{36}/);
    expect(user.email).toBe("reader@example.com");
    expect(user.provider).toBe("credentials");
    expect(user.preferences).toEqual({ locale: "en", region: "" });
    expect("passwordHash" in user).toBe(false);

    const stored = await findUserByEmail("reader@example.com");
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.passwordHash).not.toContain("correct horse");
  });

  it("verifies credentials and rejects wrong passwords / unknown users", async () => {
    await createUserWithPassword({ email: "a@b.co", password: "password123" });
    expect((await verifyCredentials("a@b.co", "password123"))?.email).toBe("a@b.co");
    expect(await verifyCredentials("a@b.co", "password124")).toBeNull();
    expect(await verifyCredentials("nobody@b.co", "password123")).toBeNull();
  });

  it("validates input", async () => {
    await expect(createUserWithPassword({ email: "not-an-email", password: "password123" })).rejects.toMatchObject({
      code: "invalid-email",
    });
    await expect(createUserWithPassword({ email: "x@y.z", password: "short" })).rejects.toBeInstanceOf(UserError);
    await createUserWithPassword({ email: "dup@y.z", password: "password123" });
    await expect(createUserWithPassword({ email: "DUP@y.z", password: "password123" })).rejects.toMatchObject({
      code: "email-taken",
    });
    expect(await countUsers()).toBe(1);
  });

  it("stores and normalises preferences", async () => {
    const user = await createUserWithPassword({ email: "p@q.r", password: "password123", locale: "bn-IN" });
    expect(user.preferences.locale).toBe("bn");
    const updated = await updatePreferences(user.id, { locale: "ta", region: "  Chennai,   Tamil Nadu <script> " });
    expect(updated?.preferences).toEqual({ locale: "ta", region: "Chennai, Tamil Nadu script" });
    expect(await updatePreferences("missing", { locale: "hi" })).toBeNull();
  });

  it("links Google sign-ins to an existing email and creates new ones otherwise", async () => {
    const local = await createUserWithPassword({ email: "g@mail.com", password: "password123", name: "" });
    const linked = await upsertOAuthUser({ email: "G@mail.com", name: "Google Name", image: "https://img/x.png" });
    expect(linked.id).toBe(local.id);
    expect(linked.provider).toBe("credentials");
    expect(linked.image).toBe("https://img/x.png");

    const fresh = await upsertOAuthUser({ email: "new@mail.com", name: "New" });
    expect(fresh.provider).toBe("google");
    expect(await countUsers()).toBe(2);
  });

  it("survives concurrent sign-ups", async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) => createUserWithPassword({ email: `u${i}@x.y`, password: "password123" })),
    );
    expect(await countUsers()).toBe(8);
  });
});
