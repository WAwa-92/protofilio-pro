# MLD

ADMIN(
  id_admin PK,
  email UNIQUE,
  password_hash,
  created_at
)

PROFILE(
  id_profile PK,
  full_name,
  title,
  bio,
  email,
  phone,
  location,
  cv_url,
  linkedin_url,
  github_url,
  updated_at
)

PROJECT(
  id_project PK,
  title,
  description,
  type,
  start_date,
  end_date,
  project_url,
  image_url,
  is_featured,
  created_at,
  updated_at
)

SKILL(
  id_skill PK,
  name,
  category,
  level,
  created_at
)

PROJECT_SKILL(
  id_project PK, FK -> PROJECT.id_project,
  id_skill PK, FK -> SKILL.id_skill
)

CONTACT_MESSAGE(
  id_message PK,
  sender_name,
  sender_email,
  subject,
  message,
  is_read,
  created_at
)

## Illustration simple

![Illustration du MLD du portfolio](mld_simple.png)
