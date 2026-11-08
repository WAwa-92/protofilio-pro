-- MPD PostgreSQL

CREATE TABLE admin (
  id_admin SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE profile (
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

CREATE TABLE project (
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

CREATE TABLE skill (
  id_skill SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('technique', 'transversale')),
  level SMALLINT CHECK (level BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_skill (
  id_project INT NOT NULL REFERENCES project(id_project) ON DELETE CASCADE,
  id_skill INT NOT NULL REFERENCES skill(id_skill) ON DELETE CASCADE,
  PRIMARY KEY (id_project, id_skill)
);

CREATE TABLE contact_message (
  id_message SERIAL PRIMARY KEY,
  sender_name VARCHAR(120) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
