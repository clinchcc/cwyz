import {
  index,
  bigint,
  int,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
  datetime,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: int().primaryKey().autoincrement(),
    uuid: varchar({ length: 255 }).unique().notNull(),
    email: varchar({ length: 255 }).notNull(),
    created_at: varchar({ length: 255 }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

export const orders = mysqlTable("orders", {
  id: int().primaryKey().autoincrement(),
  order_no: varchar({ length: 255 }).unique().notNull(),
  created_at: varchar({ length: 255 }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: int().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: varchar({ length: 255 }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: int().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: int(),
  sub_cycle_anchor: int(),
  sub_period_end: int(),
  sub_period_start: int(),
  sub_times: int(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: int(),
  order_detail: text(),
  paid_at: varchar({ length: 255 }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

export const apikeys = mysqlTable("apikeys", {
  id: int().primaryKey().autoincrement(),
  api_key: varchar({ length: 255 }).unique().notNull(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: varchar({ length: 255 }),
  status: varchar({ length: 50 }),
});

export const credits = mysqlTable("credits", {
  id: int().primaryKey().autoincrement(),
  trans_no: varchar({ length: 255 }).unique().notNull(),
  created_at: varchar({ length: 255 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: int().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: varchar({ length: 255 }),
});

export const posts = mysqlTable(
  "posts",
  {
    id: int().primaryKey().autoincrement(),
    uuid: varchar({ length: 255 }).unique().notNull(),
    slug: varchar({ length: 255 }),
    title: varchar({ length: 255 }),
    description: text(),
    content: text(),
    created_at: varchar({ length: 255 }),
    updated_at: varchar({ length: 255 }),
    status: varchar({ length: 50 }),
    cover_url: varchar({ length: 255 }),
    author_name: varchar({ length: 255 }),
    author_avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
  },
  (table) => [index("slug_locale_idx").on(table.slug, table.locale)]
);

export const terms = mysqlTable("wp_terms", {
  term_id: int().primaryKey().autoincrement(),
  name: varchar({ length: 200 }).notNull(),
  slug: varchar({ length: 200 }).notNull(),
  term_group: int().notNull().default(0),
});

export const apps = mysqlTable("apps", {
  appid: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  intro: varchar({ length: 255 }),
  content: text().notNull(),
  date: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  author: varchar({ length: 255 }),
  website: varchar({ length: 255 }),
  logo: varchar({ length: 255 }),
  screenshot: varchar({ length: 255 }),
  download_url: varchar({ length: 255 }),
  category: int().notNull().default(18),
  status: int().notNull().default(0),
});

export const tags = mysqlTable("tags", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 50 }).notNull().unique(),
  enname: varchar({ length: 50 }).notNull().unique(),
});

export const appTags = mysqlTable("app_tags", 
  {
    id: int().primaryKey().autoincrement(),
    app_id: bigint("app_id", { mode: "number" }).notNull(),
    tag_id: int().notNull(),
  },
  (table) => ({
    strict: false  // 告诉 Drizzle 不要尝试管理这个表
  })
);

export const appsen = mysqlTable("appsen", 
  {
    appid: int().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    intro: varchar({ length: 255 }),
    content: text().notNull(),
    date: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
    author: varchar({ length: 255 }),
    website: varchar({ length: 255 }),
    logo: varchar({ length: 255 }),
    screenshot: varchar({ length: 255 }),
    download_url: varchar({ length: 255 }),
    category: int().notNull().default(18),
    status: int().notNull().default(0),
  },
  (table) => ({
    strict: false  // Tell Drizzle not to manage this table
  })
);







