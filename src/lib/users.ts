import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { IS_TEST } from "./config";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./i18n/locales";

/**
 * JSON-file backed account store.
 *
 * Deliberately tiny: an append-only-ish list of users persisted to
 * `USERS_FILE` (default `.cache/newssplit-users.json`). Passwords are stored as
 * bcrypt hashes; Google sign-ins have no password at all. Swap this module for
 * a real database adapter when you outgrow a JSON file — every consumer goes
 * through the exported functions, nothing reads the file directly.
 */

export type AuthProvider = "credentials" | "google";

export interface UserPreferences {
  locale: Locale;
  region: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: AuthProvider;
  /** bcrypt hash — absent for OAuth accounts. */
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

/** What we hand to the UI / session — never includes the hash. */
export type PublicUser = Omit<UserRecord, "passwordHash">;

interface UsersFile {
  version: 1;
  users: UserRecord[];
}

export const PASSWORD_MIN_LENGTH = 8;
export const REGION_MAX_LENGTH = 80;
const BCRYPT_ROUNDS = IS_TEST ? 4 : 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usersFilePath(): string {
  const raw = process.env.USERS_FILE?.trim() || ".cache/newssplit-users.json";
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _hash, ...rest } = user;
  return rest;
}

/* ─────────────────────────── persistence ─────────────────────────── */

let writeQueue: Promise<void> = Promise.resolve();

async function readFile(): Promise<UsersFile> {
  try {
    const raw = await fs.readFile(usersFilePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<UsersFile>;
    if (parsed && Array.isArray(parsed.users)) return { version: 1, users: parsed.users as UserRecord[] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[users] could not read store, starting empty:", (error as Error).message);
    }
  }
  return { version: 1, users: [] };
}

async function writeFile(data: UsersFile): Promise<void> {
  const file = usersFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await fs.rename(tmp, file);
}

/** Serialises read-modify-write cycles so concurrent sign-ups can't clobber each other. */
function mutate<T>(fn: (data: UsersFile) => Promise<T> | T): Promise<T> {
  const run = writeQueue.then(async () => {
    const data = await readFile();
    const result = await fn(data);
    await writeFile(data);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/* ─────────────────────────── queries ─────────────────────────── */

export async function listUsers(): Promise<PublicUser[]> {
  const { users } = await readFile();
  return users.map(toPublicUser);
}

export async function countUsers(): Promise<number> {
  return (await readFile()).users.length;
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const wanted = normalizeEmail(email);
  const { users } = await readFile();
  return users.find((u) => u.email === wanted);
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const { users } = await readFile();
  return users.find((u) => u.id === id);
}

/* ─────────────────────────── mutations ─────────────────────────── */

export type CreateUserError = "invalid-email" | "weak-password" | "email-taken";

export class UserError extends Error {
  constructor(public readonly code: CreateUserError) {
    super(code);
    this.name = "UserError";
  }
}

export async function createUserWithPassword(input: {
  email: string;
  password: string;
  name?: string;
  locale?: string;
  region?: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) throw new UserError("invalid-email");
  if (typeof input.password !== "string" || input.password.length < PASSWORD_MIN_LENGTH) {
    throw new UserError("weak-password");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const now = new Date().toISOString();

  return mutate((data) => {
    if (data.users.some((u) => u.email === email)) throw new UserError("email-taken");
    const user: UserRecord = {
      id: randomUUID(),
      email,
      name: sanitizeName(input.name) || email.split("@")[0],
      provider: "credentials",
      passwordHash,
      createdAt: now,
      updatedAt: now,
      preferences: {
        locale: normalizeLocale(input.locale ?? DEFAULT_LOCALE),
        region: sanitizeRegion(input.region),
      },
    };
    data.users.push(user);
    return toPublicUser(user);
  });
}

/** Returns the public user on success, or `null` for unknown email / wrong password. */
export async function verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    // Burn roughly the same time as a real comparison so timing doesn't leak existence.
    await bcrypt.compare(password, "$2a$04$C6UzMDM.H6dfI/f/IKcEeO7Q8QO4M6kZ4xHqZwT4bOX5zC2eZkD1a");
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? toPublicUser(user) : null;
}

/** Find-or-create for OAuth sign-ins; links to an existing credentials user with the same email. */
export async function upsertOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  locale?: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) throw new UserError("invalid-email");
  const now = new Date().toISOString();

  return mutate((data) => {
    const existing = data.users.find((u) => u.email === email);
    if (existing) {
      if (input.name && !existing.name) existing.name = sanitizeName(input.name);
      if (input.image) existing.image = input.image;
      existing.updatedAt = now;
      return toPublicUser(existing);
    }
    const user: UserRecord = {
      id: randomUUID(),
      email,
      name: sanitizeName(input.name) || email.split("@")[0],
      image: input.image ?? undefined,
      provider: "google",
      createdAt: now,
      updatedAt: now,
      preferences: { locale: normalizeLocale(input.locale ?? DEFAULT_LOCALE), region: "" },
    };
    data.users.push(user);
    return toPublicUser(user);
  });
}

export async function updatePreferences(
  id: string,
  patch: Partial<{ locale: string; region: string }>,
): Promise<PublicUser | null> {
  return mutate((data) => {
    const user = data.users.find((u) => u.id === id);
    if (!user) return null;
    if (patch.locale !== undefined) user.preferences.locale = normalizeLocale(patch.locale);
    if (patch.region !== undefined) user.preferences.region = sanitizeRegion(patch.region);
    user.updatedAt = new Date().toISOString();
    return toPublicUser(user);
  });
}

/* ─────────────────────────── helpers ─────────────────────────── */

function sanitizeName(name: string | null | undefined): string {
  return (name ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
}

export function sanitizeRegion(region: string | null | undefined): string {
  return (region ?? "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, REGION_MAX_LENGTH);
}

/** Test hook — wipes the store file. */
export async function __resetUsersForTests(): Promise<void> {
  await writeQueue;
  await fs.rm(usersFilePath(), { force: true });
}
