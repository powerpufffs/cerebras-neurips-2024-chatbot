import { metadata } from '@/app/layout';
import { InferSelectModel, sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  integer,
  boolean,
  index,
  vector,
  bigint,
  bigserial,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const NeuripsMetadata = pgTable(
  'data_data_neurips_metadata_v2',
  {
    id: integer('id').primaryKey().notNull(),
    text: varchar('text', { length: 2048 }).notNull(),
    metadata: json('metadata_'),
    nodeId: text('node_id').notNull(),
    embedding: vector('embedding', { dimensions: 1024 }),
  },
  (table) => ({
    embeddingIndex: index('neurips_metadata_embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
  })
);

export type NeuripsMetadata = InferSelectModel<typeof NeuripsMetadata>;

export const NeuripsPaper = pgTable(
  'neurips_papers',
  {
    id: uuid('id').primaryKey().notNull(),
    uid: text('uid'),
    name: text('name'),
    authors: json('authors'),
    abstract: text('abstract'),
    topic: text('topic'),
    keywords: json('keywords'),
    decision: text('decision'),
    session: text('session'),
    eventtype: text('eventtype'),
    event_type: text('event_type'),
    room_name: text('room_name'),
    virtualsite_url: text('virtualsite_url'),
    url: text('url'),
    sourceid: uuid('sourceid'),
    sourceurl: text('sourceurl'),
    starttime: timestamp('starttime', { withTimezone: true }),
    endtime: timestamp('endtime', { withTimezone: true }),
    starttime2: timestamp('starttime2', { withTimezone: true }),
    endtime2: timestamp('endtime2', { withTimezone: true }),
    diversity_event: boolean('diversity_event'),
    paper_url: text('paper_url'),
    paper_pdf_url: text('paper_pdf_url'),
    children_url: text('children_url'),
    children: json('children'),
    children_ids: json('children_ids'),
    parent1: text('parent1'),
    parent2: text('parent2'),
    parent2_id: uuid('parent2_id'),
    eventmedia: json('eventmedia'),
    show_in_schedule_overview: boolean('show_in_schedule_overview'),
    visible: boolean('visible'),
    poster_position: uuid('poster_position'),
    schedule_html: text('schedule_html'),
    latitude: varchar('latitude'),
    longitude: varchar('longitude'),
    related_events: json('related_events'),
    related_events_ids: json('related_events_ids'),
    searchable_text: text('searchable_text'),
    paper_id: text('paper_id'),
    paper_source: text('paper_source'),
    huggingface_metadata: json('huggingface_metadata'),
    searchable_text_embedding: vector('searchable_text_embedding', {
      dimensions: 1024,
    }),
  },
  (table) => ({
    searchable_text_tsvector: index('search_gin_idx').using(
      'gin',
      sql`to_tsvector('english', concat_ws(' ', ${table.searchable_text}))`
    ),
  })
);

export type NeuripsPapers = InferSelectModel<typeof NeuripsPaper>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const usageLog = pgTable('usage_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
  questionText: text('question_text').notNull(),
  paperId: bigint('paper_id', { mode: 'number' }).references(
    () => NeuripsPaper.id
  ),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  metadata: json('metadata'),
});

export type UsageLog = InferSelectModel<typeof usageLog>;
