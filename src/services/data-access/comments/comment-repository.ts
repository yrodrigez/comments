import { type Comment, type CommentRecord, type Database } from "@shared/types";

export default function makeCommentsDb({ makeDatabase }: {
  makeDatabase: () => Database;
}) {
  return Object.freeze({
    async insert(comment: Comment) {
      const db = makeDatabase();
      const source = comment.getSource();
      const query = `
        INSERT INTO public.comments (id, text, author, post_id, reply_to_id, published, modified_on, ip,
                                     browser, referer, hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const values = [
        comment.getId(),
        comment.getText(),
        comment.getAuthor(),
        comment.getPostId(),
        comment.getReplyToId(),
        comment.isPublished(),
        comment.getModifiedOn(),
        source.ip,
        source.browser,
        source.referer,
        comment.getHash()
      ];
      const result = await db.query(query, values);

      const rowResult = result.rows[0];
      return rowResult;
    },

    async findById(id: string) {
      const db = makeDatabase();
      const query = `SELECT * FROM public.comments WHERE id = $1 AND deleted_at IS NULL`;
      const values = [id];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    async findByAuthor(author: string) {
      const db = makeDatabase();
      const query = `SELECT * FROM public.comments WHERE author = $1 AND deleted_at IS NULL`;
      const values = [author];
      const result = await db.query(query, values);
      return result.rows;
    },

    async findByPostId(postId: string): Promise<CommentRecord[]> {
      const db = makeDatabase();
      const query = `SELECT * FROM public.comments WHERE post_id = $1 AND deleted_at IS NULL ORDER BY created_on ASC`;
      const values = [postId];
      const result = await db.query(query, values);
      return result.rows;
    },

    async findPublishedByPostId(postId: string): Promise<CommentRecord[]> {
      const db = makeDatabase();
      const query = `SELECT * FROM public.comments WHERE post_id = $1 AND published = true AND deleted_at IS NULL ORDER BY created_on ASC`;
      const values = [postId];
      const result = await db.query(query, values);
      return result.rows;
    },

    async findAll(): Promise<CommentRecord[]> {
      const db = makeDatabase();
      const query = `SELECT * FROM public.comments WHERE deleted_at IS NULL ORDER BY created_on ASC`;
      const result = await db.query(query);
      return result.rows;
    },

    async findReplies(commentId: string): Promise<CommentRecord[]> {
      const db = makeDatabase();
      const query = `SELECT * FROM public.comments WHERE reply_to_id = $1 AND deleted_at IS NULL ORDER BY created_on ASC`;
      const values = [commentId];
      const result = await db.query(query, values);
      return result.rows;
    },

    async update(comment: Comment): Promise<CommentRecord> {
      const db = makeDatabase();
      const source = comment.getSource();
      const query = `
        UPDATE public.comments
        SET text        = $2,
            author      = $3,
            post_id     = $4,
            reply_to_id = $5,
            published   = $6,
            ip          = $7,
            browser     = $8,
            referer     = $9,
            hash        = $10,
            modified_on = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `;
      const values = [
        comment.getId(),
        comment.getText(),
        comment.getAuthor(),
        comment.getPostId(),
        comment.getReplyToId(),
        comment.isPublished(),
        source.ip,
        source.browser,
        source.referer,
        comment.getHash()
      ];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    async findByHash(hash: string): Promise<CommentRecord | undefined> {
      const db = makeDatabase();
      const query = `SELECT *
                     FROM public.comments
                     WHERE hash = $1
                       AND deleted_at IS NULL`;
      const values = [hash];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    async softDelete(id: string): Promise<CommentRecord> {
      const db = makeDatabase();
      const query = `
        UPDATE public.comments
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `;
      const values = [id];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    async hardDelete(id: string): Promise<CommentRecord> {
      const db = makeDatabase();
      const query = `DELETE
                     FROM public.comments
                     WHERE id = $1
                     RETURNING *`;
      const values = [id];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    async publish(id: string): Promise<CommentRecord> {
      const db = makeDatabase();
      const query = `
        UPDATE public.comments
        SET published   = true,
            modified_on = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `;
      const values = [id];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    async unpublish(id: string): Promise<CommentRecord> {
      const db = makeDatabase();
      const query = `
        UPDATE public.comments
        SET published   = false,
            modified_on = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `;
      const values = [id];
      const result = await db.query(query, values);
      return result.rows[0];
    }
  });
}