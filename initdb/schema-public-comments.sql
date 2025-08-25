-- Comments API Database Schema
-- This script creates the necessary tables for the comments system in the public schema

CREATE SCHEMA IF NOT EXISTS public;

-- Ensure we're working in the public schema
SET search_path TO public;

-- Enable UUID extension if needed (for PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Create the comments table in public schema
CREATE TABLE IF NOT EXISTS public.comments (
    -- Primary identifier using CUID2 format
    id VARCHAR(24) PRIMARY KEY,

    -- Comment content and metadata
    text TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,

    -- Post reference
    post_id VARCHAR(24) NOT NULL,

    -- Reply functionality
    reply_to_id VARCHAR(24) NULL,

    -- Publication status
    published BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Source information (tracking where comment came from)
    ip INET NOT NULL,
    browser TEXT NOT NULL,
    referer TEXT NULL,

    -- Content hash for duplicate detection
    hash VARCHAR(32) NOT NULL,

    -- Soft delete support
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    -- Constraints
    CONSTRAINT fk_comments_reply_to_id
        FOREIGN KEY (reply_to_id)
        REFERENCES public.comments(id)
        ON DELETE SET NULL,

    -- Ensure text is not empty after trimming
    CONSTRAINT chk_text_not_empty
        CHECK (LENGTH(TRIM(text)) > 0),

    -- Ensure author is not empty after trimming
    CONSTRAINT chk_author_not_empty
        CHECK (LENGTH(TRIM(author)) > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author);
CREATE INDEX IF NOT EXISTS idx_comments_reply_to_id ON public.comments(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_comments_published ON public.comments(published);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_hash ON public.comments(hash);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON public.comments(deleted_at);

-- Composite index for finding published comments by post
CREATE INDEX IF NOT EXISTS idx_comments_post_published
    ON public.comments(post_id, published, created_at)
    WHERE deleted_at IS NULL;

-- Composite index for finding replies to a comment
CREATE INDEX IF NOT EXISTS idx_comments_replies
    ON public.comments(reply_to_id, created_at)
    WHERE reply_to_id IS NOT NULL AND deleted_at IS NULL;

-- Create a function to automatically update modified_on timestamp in public schema
CREATE OR REPLACE FUNCTION public.update_modified_on_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_on = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update modified_on when a row is updated
CREATE TRIGGER update_comments_modified_on
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_on_column();

-- Create a view for active (non-deleted) comments in public schema
CREATE OR REPLACE VIEW public.active_comments AS
SELECT
    id,
    text,
    author,
    post_id,
    reply_to_id,
    published,
    created_at,
    modified_on,
    ip,
    browser,
    referer,
    hash
FROM public.comments
WHERE deleted_at IS NULL;

-- Create a view for published comments only in public schema
CREATE OR REPLACE VIEW public.published_comments AS
SELECT
    id,
    text,
    author,
    post_id,
    reply_to_id,
    created_at,
    modified_on,
    ip,
    browser,
    referer,
    hash
FROM public.comments
WHERE published = TRUE AND deleted_at IS NULL;

-- Optional: Create a posts table if it doesn't exist elsewhere in public schema
-- This ensures referential integrity for post_id
CREATE TABLE IF NOT EXISTS public.posts (
    id VARCHAR(24) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_posts_title_not_empty
        CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT chk_posts_content_not_empty
        CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT chk_posts_author_not_empty
        CHECK (LENGTH(TRIM(author)) > 0)
);

-- Add foreign key constraint from comments to posts in public schema
ALTER TABLE public.comments
ADD CONSTRAINT fk_comments_post_id
FOREIGN KEY (post_id)
REFERENCES public.posts(id)
ON DELETE CASCADE;

-- Create indexes for posts table in public schema
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);

-- Create trigger for posts modified_on as well
CREATE TRIGGER update_posts_modified_on
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_on_column();
