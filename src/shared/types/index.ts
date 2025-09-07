// Branded types for type safety
export type CommentId = string & { readonly brand: unique symbol };
export type PostId = string & { readonly brand: unique symbol };

// Domain types
export interface CommentSource {
  ip: string;
  browser: string;
  referer?: string | undefined;
}

export interface CommentInput {
  id?: string | undefined;
  author: string;
  text: string;
  postId: string;
  replyToId?: string | undefined;
  published?: boolean | undefined;
  createdOn?: Date | undefined;
  modifiedOn?: Date | undefined;
  source: CommentSource;
}

export interface Comment {
  getId(): string;
  getAuthor(): string;
  getText(showDeleted?: boolean): string;
  getPostId(): string;
  getReplyToId(): string | undefined;
  isPublished(): boolean;
  getCreatedOn(): Date;
  getModifiedOn(): Date;
  getSource(): CommentSource;
  getHash(): string;
  markAsDeleted(): void;
}

export interface CommentRecord {
  id: string;
  text: string;
  author: string;
  post_id: string;
  reply_to_id?: string;
  published: boolean;
  created_on: Date;
  modified_on: Date;
  ip: string;
  browser: string;
  referer?: string;
  hash: string;
  deleted_at?: Date;
}

// Database interface
export interface Database {
  query(query: string, values?: any[]): Promise<{ rows: any[] }>;
}