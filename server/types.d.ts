import "express-session";

declare global {
  namespace Express {
    interface Request {
      session?: import("express-session").Session & { userId?: number };
    }
  }
}

export {};
