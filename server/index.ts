import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import bcrypt from "bcryptjs";
import cors from "cors";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "icube-dubai-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// Auth middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session?.userId) return next();
  res.status(401).json({ error: "Unauthorized" });
}

// ----- Public API (site content) -----

app.get("/api/site/settings", (_req, res) => {
  const rows = db.prepare("SELECT key, value FROM site_settings").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach((r) => (settings[r.key] = r.value));
  res.json(settings);
});

app.get("/api/services", (_req, res) => {
  const list = db.prepare("SELECT * FROM services ORDER BY sort_order, id").all();
  res.json(list);
});

app.get("/api/portfolio", (_req, res) => {
  const list = db.prepare("SELECT * FROM portfolio ORDER BY sort_order, id").all();
  res.json(list);
});

app.get("/api/testimonials", (_req, res) => {
  const list = db.prepare("SELECT * FROM testimonials ORDER BY sort_order, id").all();
  res.json(list);
});

app.get("/api/booking-packages", (_req, res) => {
  const list = db.prepare("SELECT * FROM booking_packages ORDER BY sort_order, id").all();
  res.json(list);
});

app.get("/api/why-us", (_req, res) => {
  const list = db.prepare("SELECT * FROM why_us ORDER BY sort_order, id").all();
  res.json(list);
});

app.get("/api/studio-equipment", (_req, res) => {
  const list = db.prepare("SELECT * FROM studio_equipment ORDER BY sort_order, id").all();
  res.json(list);
});

app.get("/api/studios", (_req, res) => {
  const studios = db
    .prepare(
      "SELECT id, name, short_description, details, price_aed_per_hour, capacity, size_sqm, cover_image_url, hero_gif_url, sort_order FROM studios ORDER BY sort_order, id"
    )
    .all() as {
    id: number;
    name: string;
    short_description: string;
    details: string;
    price_aed_per_hour: number;
    capacity: number;
    size_sqm: number;
    cover_image_url: string;
    hero_gif_url: string | null;
    sort_order: number;
  }[];

  const images = db
    .prepare("SELECT studio_id, image_url, caption, sort_order FROM studio_images ORDER BY sort_order, id")
    .all() as { studio_id: number; image_url: string; caption: string | null; sort_order: number }[];

  const byStudio = new Map<number, { image_url: string; caption: string | null; sort_order: number }[]>();
  for (const img of images) {
    const list = byStudio.get(img.studio_id) || [];
    list.push({ image_url: img.image_url, caption: img.caption, sort_order: img.sort_order });
    byStudio.set(img.studio_id, list);
  }

  res.json(
    studios.map((s) => ({
      ...s,
      images: byStudio.get(s.id) || [],
    }))
  );
});

// Form submissions (public)
app.post("/api/booking", (req, res) => {
  const { first_name, last_name, email, project_details, package_id } = req.body;
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  db.prepare(
    "INSERT INTO bookings (first_name, last_name, email, project_details, package_id) VALUES (?, ?, ?, ?, ?)"
  ).run(first_name, last_name, email, project_details || null, package_id || null);
  res.status(201).json({ success: true });
});

app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)").run(
    name,
    email,
    subject,
    message
  );
  res.status(201).json({ success: true });
});

// ----- Auth -----
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as
    | { id: number; password_hash: string }
    | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  req.session!.userId = user.id;
  res.json({ success: true, user: { id: user.id, email } });
});

app.post("/api/logout", (req, res) => {
  req.session?.destroy(() => {});
  res.json({ success: true });
});

app.get("/api/me", (req, res) => {
  if (req.session?.userId) {
    const user = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(req.session.userId) as
      | { id: number; email: string; name: string | null }
      | undefined;
    if (user) return res.json(user);
  }
  res.status(401).json({ error: "Not logged in" });
});

// ----- Dashboard API (protected) -----

// Site settings
app.get("/api/dashboard/settings", requireAuth, (_req, res) => {
  const rows = db.prepare("SELECT key, value FROM site_settings").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach((r) => (settings[r.key] = r.value));
  res.json(settings);
});

app.put("/api/dashboard/settings", requireAuth, (req, res) => {
  const body = req.body as Record<string, string>;
  const stmt = db.prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  for (const [k, v] of Object.entries(body)) stmt.run(k, v);
  res.json({ success: true });
});

// Services CRUD
app.get("/api/dashboard/services", requireAuth, (_req, res) => {
  res.json(db.prepare("SELECT * FROM services ORDER BY sort_order, id").all());
});
app.post("/api/dashboard/services", requireAuth, (req, res) => {
  const { title, description, icon, sort_order } = req.body;
  const id = db.prepare("INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)").run(
    title,
    description,
    icon || "Mic",
    sort_order ?? 0
  ).lastInsertRowid;
  res.status(201).json({ id, title, description, icon, sort_order: sort_order ?? 0 });
});
app.put("/api/dashboard/services/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, description, icon, sort_order } = req.body;
  db.prepare("UPDATE services SET title=?, description=?, icon=?, sort_order=? WHERE id=?").run(
    title,
    description,
    icon,
    sort_order,
    id
  );
  res.json({ success: true });
});
app.delete("/api/dashboard/services/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM services WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// Portfolio CRUD
app.get("/api/dashboard/portfolio", requireAuth, (_req, res) => {
  res.json(db.prepare("SELECT * FROM portfolio ORDER BY sort_order, id").all());
});
app.post("/api/dashboard/portfolio", requireAuth, (req, res) => {
  const { title, category, image_url, sort_order } = req.body;
  const id = db.prepare("INSERT INTO portfolio (title, category, image_url, sort_order) VALUES (?, ?, ?, ?)").run(
    title,
    category,
    image_url,
    sort_order ?? 0
  ).lastInsertRowid;
  res.status(201).json({ id, title, category, image_url, sort_order: sort_order ?? 0 });
});
app.put("/api/dashboard/portfolio/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, category, image_url, sort_order } = req.body;
  db.prepare("UPDATE portfolio SET title=?, category=?, image_url=?, sort_order=? WHERE id=?").run(
    title,
    category,
    image_url,
    sort_order,
    id
  );
  res.json({ success: true });
});
app.delete("/api/dashboard/portfolio/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM portfolio WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// Testimonials CRUD
app.get("/api/dashboard/testimonials", requireAuth, (_req, res) => {
  res.json(db.prepare("SELECT * FROM testimonials ORDER BY sort_order, id").all());
});
app.post("/api/dashboard/testimonials", requireAuth, (req, res) => {
  const { quote, author, role, image_url, sort_order } = req.body;
  const id = db
    .prepare("INSERT INTO testimonials (quote, author, role, image_url, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(quote, author, role, image_url, sort_order ?? 0).lastInsertRowid;
  res.status(201).json({ id, quote, author, role, image_url, sort_order: sort_order ?? 0 });
});
app.put("/api/dashboard/testimonials/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { quote, author, role, image_url, sort_order } = req.body;
  db.prepare("UPDATE testimonials SET quote=?, author=?, role=?, image_url=?, sort_order=? WHERE id=?").run(
    quote,
    author,
    role,
    image_url,
    sort_order,
    id
  );
  res.json({ success: true });
});
app.delete("/api/dashboard/testimonials/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM testimonials WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// Booking packages CRUD
app.get("/api/dashboard/packages", requireAuth, (_req, res) => {
  res.json(db.prepare("SELECT * FROM booking_packages ORDER BY sort_order, id").all());
});
app.post("/api/dashboard/packages", requireAuth, (req, res) => {
  const { name, price_aed, duration, features, is_popular, sort_order } = req.body;
  const featuresStr = typeof features === "string" ? features : JSON.stringify(features || []);
  const id = db
    .prepare(
      "INSERT INTO booking_packages (name, price_aed, duration, features, is_popular, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name, price_aed, duration, featuresStr, is_popular ? 1 : 0, sort_order ?? 0).lastInsertRowid;
  res.status(201).json({ id, name, price_aed, duration, features: featuresStr, is_popular: !!is_popular, sort_order: sort_order ?? 0 });
});
app.put("/api/dashboard/packages/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, price_aed, duration, features, is_popular, sort_order } = req.body;
  const featuresStr = typeof features === "string" ? features : JSON.stringify(features || []);
  db.prepare(
    "UPDATE booking_packages SET name=?, price_aed=?, duration=?, features=?, is_popular=?, sort_order=? WHERE id=?"
  ).run(name, price_aed, duration, featuresStr, is_popular ? 1 : 0, sort_order, id);
  res.json({ success: true });
});
app.delete("/api/dashboard/packages/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM booking_packages WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// Bookings list
app.get("/api/dashboard/bookings", requireAuth, (_req, res) => {
  const list = db
    .prepare(
      `SELECT b.*, p.name as package_name FROM bookings b LEFT JOIN booking_packages p ON b.package_id = p.id ORDER BY b.created_at DESC`
    )
    .all();
  res.json(list);
});

app.patch("/api/dashboard/bookings/:id", requireAuth, (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE bookings SET status=? WHERE id=?").run(status, req.params.id);
  res.json({ success: true });
});

// Contact messages
app.get("/api/dashboard/messages", requireAuth, (_req, res) => {
  const list = db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
  res.json(list);
});

app.patch("/api/dashboard/messages/:id/read", requireAuth, (req, res) => {
  db.prepare("UPDATE contact_messages SET read_at = datetime('now') WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// Why us CRUD
app.get("/api/dashboard/why-us", requireAuth, (_req, res) => {
  res.json(db.prepare("SELECT * FROM why_us ORDER BY sort_order, id").all());
});
app.put("/api/dashboard/why-us/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { icon, title, description, sort_order } = req.body;
  db.prepare("UPDATE why_us SET icon=?, title=?, description=?, sort_order=? WHERE id=?").run(
    icon,
    title,
    description,
    sort_order,
    id
  );
  res.json({ success: true });
});

// Studio equipment
app.get("/api/dashboard/studio-equipment", requireAuth, (_req, res) => {
  res.json(db.prepare("SELECT * FROM studio_equipment ORDER BY sort_order, id").all());
});
app.put("/api/dashboard/studio-equipment/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { label, description, sort_order } = req.body;
  db.prepare("UPDATE studio_equipment SET label=?, description=?, sort_order=? WHERE id=?").run(
    label,
    description,
    sort_order,
    id
  );
  res.json({ success: true });
});

// Studios gallery CRUD
app.get("/api/dashboard/studios", requireAuth, (_req, res) => {
  const studios = db
    .prepare(
      "SELECT id, name, short_description, details, price_aed_per_hour, capacity, size_sqm, cover_image_url, hero_gif_url, sort_order FROM studios ORDER BY sort_order, id"
    )
    .all();
  const images = db
    .prepare("SELECT studio_id, image_url, caption, sort_order FROM studio_images ORDER BY sort_order, id")
    .all() as { studio_id: number; image_url: string; caption: string | null; sort_order: number }[];
  const byStudio = new Map<number, { image_url: string; caption: string | null; sort_order: number }[]>();
  for (const img of images) {
    const list = byStudio.get(img.studio_id) || [];
    list.push({ image_url: img.image_url, caption: img.caption, sort_order: img.sort_order });
    byStudio.set(img.studio_id, list);
  }
  res.json((studios as any[]).map((s) => ({ ...s, images: byStudio.get(s.id) || [] })));
});

app.post("/api/dashboard/studios", requireAuth, (req, res) => {
  const { name, short_description, details, price_aed_per_hour, capacity, size_sqm, cover_image_url, hero_gif_url, sort_order, images } =
    req.body as {
      name: string;
      short_description: string;
      details: string;
      price_aed_per_hour: number;
      capacity: number;
      size_sqm: number;
      cover_image_url: string;
      hero_gif_url?: string;
      sort_order?: number;
      images?: { image_url: string; caption?: string | null }[] | string[];
    };

  const result = db
    .prepare(
      "INSERT INTO studios (name, short_description, details, price_aed_per_hour, capacity, size_sqm, cover_image_url, hero_gif_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      name,
      short_description,
      details,
      price_aed_per_hour,
      capacity,
      size_sqm,
      cover_image_url,
      hero_gif_url?.trim() || null,
      sort_order ?? 0
    );
  const id = Number(result.lastInsertRowid);

  const insertImg = db.prepare("INSERT INTO studio_images (studio_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)");
  const imgList: { image_url: string; caption?: string | null }[] = Array.isArray(images)
    ? (images as any[]).map((x) => (typeof x === "string" ? { image_url: x } : x))
    : [];
  imgList.forEach((img, idx) => insertImg.run(id, img.image_url, img.caption ?? null, idx));

  res.status(201).json({ success: true, id });
});

app.put("/api/dashboard/studios/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, short_description, details, price_aed_per_hour, capacity, size_sqm, cover_image_url, hero_gif_url, sort_order, images } =
    req.body as {
      name: string;
      short_description: string;
      details: string;
      price_aed_per_hour: number;
      capacity: number;
      size_sqm: number;
      cover_image_url: string;
      hero_gif_url?: string;
      sort_order?: number;
      images?: { image_url: string; caption?: string | null }[] | string[];
    };

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE studios SET name=?, short_description=?, details=?, price_aed_per_hour=?, capacity=?, size_sqm=?, cover_image_url=?, hero_gif_url=?, sort_order=? WHERE id=?"
    ).run(
      name,
      short_description,
      details,
      price_aed_per_hour,
      capacity,
      size_sqm,
      cover_image_url,
      hero_gif_url?.trim() || null,
      sort_order ?? 0,
      id
    );
    db.prepare("DELETE FROM studio_images WHERE studio_id=?").run(id);
    const insertImg = db.prepare("INSERT INTO studio_images (studio_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)");
    const imgList: { image_url: string; caption?: string | null }[] = Array.isArray(images)
      ? (images as any[]).map((x) => (typeof x === "string" ? { image_url: x } : x))
      : [];
    imgList.forEach((img, idx) => insertImg.run(id, img.image_url, img.caption ?? null, idx));
  });
  tx();
  res.json({ success: true });
});

app.delete("/api/dashboard/studios/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM studio_images WHERE studio_id=?").run(id);
    db.prepare("DELETE FROM studios WHERE id=?").run(id);
  });
  tx();
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
