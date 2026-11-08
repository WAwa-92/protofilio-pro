const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin (
      id_admin SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS profile (
      id_profile SERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      title VARCHAR(160) NOT NULL,
      bio TEXT,
      email VARCHAR(255),
      phone VARCHAR(30),
      location VARCHAR(120),
      cv_url TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS project (
      id_project SERIAL PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('projet', 'experience')),
      start_date DATE,
      end_date DATE,
      project_url TEXT,
      image_url TEXT,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS skill (
      id_skill SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      category VARCHAR(20) NOT NULL CHECK (category IN ('technique', 'transversale')),
      level SMALLINT CHECK (level BETWEEN 1 AND 5),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS project_skill (
      id_project INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
      id_skill INT NOT NULL REFERENCES skill(id_skill) ON DELETE CASCADE,
      PRIMARY KEY (id_project, id_skill)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS contact_message (
      id_message SERIAL PRIMARY KEY,
      sender_name VARCHAR(120) NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      subject VARCHAR(160) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const profiles = await query("SELECT id_profile FROM profile LIMIT 1");
  if (!profiles.length) {
    await query(
      `INSERT INTO profile (full_name, title, bio, email, phone, location)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        "Wael Bakkay",
        "Développeur Full Stack Junior",
        "Je conçois des applications web modernes, maintenables et orientées utilisateur.",
        "wael.bakkay@email.com",
        "+33 6 00 00 00 00",
        "France",
      ]
    );
  }

  const admins = await query("SELECT id_admin FROM admin LIMIT 1");
  if (!admins.length) {
    const email = process.env.ADMIN_EMAIL || "admin@portfolio.local";
    const plainPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await query(
      "INSERT INTO admin (email, password_hash) VALUES ($1, $2)",
      [email, passwordHash]
    );
  }
}

module.exports = {
  pool,
  query,
  initializeDatabase,
};
