# MCD (version texte)

## Entités

### ADMIN
- id_admin (PK)
- email (unique)
- password_hash
- created_at

### PROFILE
- id_profile (PK)
- full_name
- title
- bio
- email
- phone
- location
- cv_url
- linkedin_url
- github_url
- updated_at

### PROJECT
- id_project (PK)
- title
- description
- type (projet|experience)
- start_date
- end_date
- project_url
- image_url
- is_featured
- created_at
- updated_at

### SKILL
- id_skill (PK)
- name
- category (technique|transversale)
- level
- created_at

### CONTACT_MESSAGE
- id_message (PK)
- sender_name
- sender_email
- subject
- message
- is_read
- created_at

## Associations
- PROJECT (N,N) SKILL via PROJECT_SKILL

### PROJECT_SKILL (association)
- id_project (FK)
- id_skill (FK)
- PK(id_project, id_skill)
