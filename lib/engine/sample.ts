export const DEFAULT_DBML = `// Skema Database Live DB Diagram
// Ketik DBML atau gunakan editor diagram visual untuk mengedit skema

Table users as U {
  id integer [pk, increment]
  username varchar(50) [not null, unique, note: 'Username akun pengguna']
  email varchar(100) [not null, unique]
  password_hash varchar(255) [not null]
  status varchar(20) [default: 'active']
  created_at timestamp [default: \`now()\`]

  indexes {
    (email) [unique]
    (status)
  }
}

Table posts {
  id integer [pk, increment]
  user_id integer [not null]
  title varchar(200) [not null]
  slug varchar(200) [not null, unique]
  content text
  is_published boolean [default: false]
  published_at timestamp
  created_at timestamp [default: \`now()\`]

  indexes {
    (slug) [unique]
    (user_id)
  }
}

Table categories {
  id integer [pk, increment]
  name varchar(50) [not null, unique]
  description text
}

Table post_categories {
  post_id integer [not null]
  category_id integer [not null]

  indexes {
    (post_id, category_id) [unique]
  }
}

Table comments {
  id integer [pk, increment]
  post_id integer [not null]
  user_id integer [not null]
  content text [not null]
  created_at timestamp [default: \`now()\`]
}

// Hubungan Antar Tabel (Relasi)
Ref: posts.user_id > users.id [delete: cascade]
Ref: comments.post_id > posts.id [delete: cascade]
Ref: comments.user_id > users.id [delete: cascade]
Ref: post_categories.post_id > posts.id [delete: cascade]
Ref: post_categories.category_id > categories.id [delete: cascade]
`;
