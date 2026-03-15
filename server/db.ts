import Database from "better-sqlite3";
import path from "path";
import { mkdirSync, existsSync } from "fs";
import bcrypt from "bcryptjs";

const dataDir = path.join(process.cwd(), "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "icube.db");
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    details TEXT NOT NULL,
    price_aed_per_hour INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    size_sqm INTEGER NOT NULL,
    cover_image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studio_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studio_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS booking_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_aed INTEGER NOT NULL,
    duration TEXT NOT NULL,
    features TEXT NOT NULL,
    is_popular INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_details TEXT,
    package_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (package_id) REFERENCES booking_packages(id)
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS why_us (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studio_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed default admin (password: admin123)
const adminHash = bcrypt.hashSync("admin123", 10);
db.prepare(
  `INSERT OR IGNORE INTO users (id, email, password_hash, name) VALUES (1, 'admin@icube.ae', ?, 'Admin')`
).run(adminHash);

// Seed default site_settings for Dubai
const defaults: [string, string][] = [
  ["hero_tagline", ""],
  ["hero_title_1", ""],
  ["hero_title_2", ""],
  ["hero_title_3", ""],
  ["hero_subtitle", ""],
  ["contact_address", "Dubai Media City, Building 1\nDubai, United Arab Emirates"],
  ["contact_email", "hello@icube.ae"],
  ["contact_email_bookings", "bookings@icube.ae"],
  ["contact_phone", "+971 4 123 4567"],
  ["contact_hours", "Sun–Thu, 9am – 6pm GST"],
  ["social_instagram", "#"],
  ["social_youtube", "#"],
  ["social_twitter", "#"],
];

const insertSetting = db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)");
for (const [k, v] of defaults) insertSetting.run(k, v);

// Seed default content if tables empty
const serviceCount = db.prepare("SELECT COUNT(*) as c FROM services").get() as { c: number };
if (serviceCount.c === 0) {
  db.exec(`
    INSERT INTO services (title, description, icon, sort_order) VALUES
    ('Podcast Studio Rental', 'Fully equipped soundproof studio with broadcast-quality microphones and multi-cam setup.', 'Mic', 0),
    ('Podcast Production', 'End-to-end production including recording, mixing, mastering, and distribution strategy.', 'MonitorPlay', 1),
    ('Social Media Content', 'Short-form vertical video creation optimized for TikTok, Reels, and Shorts.', 'Share2', 2),
    ('Professional Filming', 'Cinematic 4K video production for commercials, interviews, and brand storytelling.', 'Video', 3),
    ('Post-Production', 'Expert video editing, color grading, motion graphics, and sound design.', 'Clapperboard', 4);
  `);
}

const packageCount = db.prepare("SELECT COUNT(*) as c FROM booking_packages").get() as { c: number };
if (packageCount.c === 0) {
  db.exec(`
    INSERT INTO booking_packages (name, price_aed, duration, features, is_popular, sort_order) VALUES
    ('Basic Session', 550, '2 Hours', '["Studio Rental","2 Microphones","Basic Lighting","Raw Audio Files"]', 0, 0),
    ('Pro Production', 1650, '4 Hours', '["Studio Rental","4 Microphones","3-Camera Setup","Audio Engineer","Raw Video/Audio"]', 1, 1),
    ('Full Service', 3100, 'Half Day', '["Studio Rental","Full Equipment","Audio Engineer","Video Director","Edited Final Video"]', 0, 2);
  `);
}

const portfolioCount = db.prepare("SELECT COUNT(*) as c FROM portfolio").get() as { c: number };
if (portfolioCount.c === 0) {
  db.exec(`
    INSERT INTO portfolio (title, category, image_url, sort_order) VALUES
    ('The Creative Mind', 'Podcast Production', 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?q=80&w=2076&auto=format&fit=crop', 0),
    ('Neon Nights', 'Video Production', 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=2071&auto=format&fit=crop', 1),
    ('Tech Talk Daily', 'Social Media Content', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop', 2),
    ('Brand Story: Echo', 'Commercial Filming', 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2000&auto=format&fit=crop', 3);
  `);
}

const testimonialCount = db.prepare("SELECT COUNT(*) as c FROM testimonials").get() as { c: number };
if (testimonialCount.c === 0) {
  db.exec(`
    INSERT INTO testimonials (quote, author, role, image_url, sort_order) VALUES
    ('ICUBE completely transformed our podcast. The audio quality is pristine, and the video setup is world-class. Best studio in Dubai.', 'Sarah Al Maktoum', 'Host, The Daily Grind', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop', 0),
    ('We shot our entire campaign here. The team is incredibly professional. Highly recommended for brands in the UAE.', 'Marcus Chen', 'Creative Director, Vibe Apparel', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop', 1),
    ('From pre-production to the final edit, ICUBE handled everything flawlessly. They understood our vision.', 'Elena Rodriguez', 'Founder, TechStart', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop', 2);
  `);
}

const whyUsCount = db.prepare("SELECT COUNT(*) as c FROM why_us").get() as { c: number };
if (whyUsCount.c === 0) {
  db.exec(`
    INSERT INTO why_us (icon, title, description, sort_order) VALUES
    ('Sparkles', 'Unmatched Creativity', 'We craft narratives, design visual experiences, and build content that resonates with your audience across the UAE and beyond.', 0),
    ('Target', 'Production Quality', 'Broadcast-grade audio and cinematic 4K. Your brand deserves nothing less than premium.', 1),
    ('Zap', 'Professional Environment', 'A focused, inspiring studio in Dubai where you can walk in and start creating immediately.', 2);
  `);
}

const equipmentCount = db.prepare("SELECT COUNT(*) as c FROM studio_equipment").get() as { c: number };
if (equipmentCount.c === 0) {
  db.exec(`
    INSERT INTO studio_equipment (label, description, sort_order) VALUES
    ('Microphones', 'Shure SM7B Broadcast Dynamics', 0),
    ('Cameras', 'Sony FX3 Cinema Line 4K', 1),
    ('Lighting', 'Aputure Pro Studio Lighting', 2),
    ('Environment', 'Soundproofed & Climate Controlled', 3);
  `);
}

const studiosCount = db.prepare("SELECT COUNT(*) as c FROM studios").get() as { c: number };
if (studiosCount.c === 0) {
  db.exec(`
    INSERT INTO studios (name, short_description, details, price_aed_per_hour, capacity, size_sqm, cover_image_url, sort_order) VALUES
    ('Studio A – Podcast Suite', 'Soundproof podcast studio with 3-camera setup.', 'Ideal for podcasts, interviews, and talk shows. Includes acoustic treatment, multi-cam recording, and professional lighting control.', 350, 4, 28, 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?q=80&w=2076&auto=format&fit=crop', 0),
    ('Studio B – Video Set', 'Flexible video studio for commercials and brand content.', 'A versatile set with modular backgrounds, controlled lighting, and space for product shoots, branded shows, and social content.', 500, 8, 45, 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2000&auto=format&fit=crop', 1),
    ('Studio C – Creator Corner', 'Compact studio optimized for vertical content and livestreams.', 'Perfect for TikTok/Reels/Shorts and livestreaming. Quick setup, modern look, and ready-to-shoot lighting presets.', 250, 3, 18, 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=2071&auto=format&fit=crop', 2);
  `);

  const studios = db.prepare("SELECT id, sort_order FROM studios ORDER BY sort_order, id").all() as { id: number; sort_order: number }[];
  const img = db.prepare(
    "INSERT INTO studio_images (studio_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)"
  );

  // Images per studio (4 each)
  for (const s of studios) {
    const base = s.sort_order;
    const urls =
      base === 0
        ? [
            "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516280440502-65f536af1270?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?q=80&w=2070&auto=format&fit=crop",
          ]
        : base === 1
          ? [
              "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2000&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1516280440502-65f536af1270?q=80&w=2070&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
            ]
          : [
              "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=2071&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?q=80&w=2076&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=2070&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?q=80&w=2070&auto=format&fit=crop",
            ];
    urls.forEach((u, i) => img.run(s.id, u, null, i));
  }
}

export default db;
