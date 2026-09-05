import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

export class FirebaseAdminConfigError extends Error {
  readonly code = "FIREBASE_ADMIN_NOT_CONFIGURED";

  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigError";
  }
}

const SETUP_HINT =
  "Add server-only credentials from Firebase Console → Project settings → Service accounts → Generate new private key. " +
  "Use the same project as NEXT_PUBLIC_FIREBASE_PROJECT_ID. " +
  "On Vercel set FIREBASE_SERVICE_ACCOUNT_JSON (recommended). " +
  "Locally use FIREBASE_SERVICE_ACCOUNT_JSON in .env.local, or save the JSON as ./firebase-service-account.json (gitignored).";

type ServiceAccountCredential = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

function parseServiceAccountJson(json: string, source: string): ServiceAccountCredential {
  let parsed: { project_id?: string; client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(json) as typeof parsed;
  } catch {
    throw new FirebaseAdminConfigError(`Invalid service account JSON (${source}). ${SETUP_HINT}`);
  }

  const projectId = parsed.project_id?.trim();
  const clientEmail = parsed.client_email?.trim();
  const privateKey = parsed.private_key ? normalizePrivateKey(parsed.private_key) : "";

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseAdminConfigError(`Incomplete service account JSON (${source}). ${SETUP_HINT}`);
  }

  return { projectId, clientEmail, privateKey };
}

function readServiceAccountFile(filePath: string): ServiceAccountCredential | null {
  const absolute = resolve(filePath);
  if (!existsSync(absolute)) return null;
  const raw = readFileSync(absolute, "utf8");
  return parseServiceAccountJson(raw, absolute);
}

function getProjectRoot(): string {
  const candidates = new Set<string>([process.cwd()]);

  // When bundled, cwd can differ from the repo root — walk up to package.json.
  try {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 8; i++) {
      candidates.add(dir);
      if (existsSync(resolve(dir, "package.json"))) break;
      dir = resolve(dir, "..");
    }
  } catch {
    // import.meta.url unavailable in some runtimes; cwd fallback only.
  }

  for (const dir of candidates) {
    if (existsSync(resolve(dir, "package.json"))) return dir;
  }
  return process.cwd();
}

function discoverLocalServiceAccountPaths(): string[] {
  const roots = [...new Set([getProjectRoot(), process.cwd()])];
  const paths: string[] = [];

  for (const root of roots) {
    const explicit = resolve(root, "firebase-service-account.json");
    if (existsSync(explicit)) paths.push(explicit);

    try {
      for (const name of readdirSync(root)) {
        if (!name.endsWith(".json")) continue;
        if (name === "package.json" || name === "package-lock.json" || name === "tsconfig.json") continue;
        if (name === "firebase-service-account.json" || name.includes("firebase-adminsdk")) {
          paths.push(resolve(root, name));
        }
      }
    } catch {
      // ignore unreadable directories
    }
  }

  return [...new Set(paths)];
}

function readLocalDevServiceAccount(): ServiceAccountCredential | null {
  // Never read credential files from disk on Vercel/serverless.
  if (process.env.VERCEL === "1") {
    return null;
  }

  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim(),
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    ...discoverLocalServiceAccountPaths(),
  ].filter(Boolean) as string[];

  if (process.env.NODE_ENV !== "production") {
    console.info("[firebase-admin] Local credential search paths:", candidates);
  }

  for (const candidate of candidates) {
    try {
      const cred = readServiceAccountFile(candidate);
      if (cred) {
        if (process.env.NODE_ENV !== "production") {
          console.info("[firebase-admin] Loaded service account from file:", candidate);
        }
        return cred;
      }
    } catch (err) {
      if (err instanceof FirebaseAdminConfigError) throw err;
      if (process.env.NODE_ENV !== "production") {
        console.warn("[firebase-admin] Failed to read credential file:", candidate, err);
      }
    }
  }

  return null;
}

function resolveServiceAccountCredential(): ServiceAccountCredential {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonEnv) {
    return parseServiceAccountJson(jsonEnv, "FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    : "";

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  const fromFile = readLocalDevServiceAccount();
  if (fromFile) return fromFile;

  throw new FirebaseAdminConfigError(`Firebase Admin credentials missing. ${SETUP_HINT}`);
}

function initAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const credential = resolveServiceAccountCredential();
  adminApp = initializeApp({
    credential: cert(credential),
  });
  return adminApp;
}

export function isFirebaseAdminConfigError(err: unknown): err is FirebaseAdminConfigError {
  return err instanceof FirebaseAdminConfigError;
}

/** Server-only. Never import from client components. */
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    initAdminApp();
    adminDb = getFirestore();
  }
  return adminDb;
}

/** Server-only. Never import from client components. */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(initAdminApp());
  }
  return adminAuth;
}
