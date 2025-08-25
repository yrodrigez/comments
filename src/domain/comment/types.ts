export interface SourceInput {
    ip: string;
    browser: string;
    referer?: string | undefined;
}

export type Source = Readonly<{
    getIp(): string;
    getBrowser(): string;
    getReferer(): (string | undefined);
}>

export interface CommentInput {
    id?: string;
    author: string; // Required field, not optional
    source: SourceInput;
    modifiedOn?: Date;
    createdOn?: Date;
    hash?: string;
    postId: string;
    published?: boolean;
    replyToId?: string | undefined;
    text: string;
}

export type Comment = Readonly<{
    getId: () => string,
    getAuthor: () => string,
    getSource: () => Source,
    getModifiedOn: () => Date,
    getPostId: () => string,
    isPublished: () => boolean,
    getReplyToId: () => (string | undefined),
    getText: (includeDeletedText?: boolean) => string,
    getHash: () => string,
    markAsDeleted: () => void
    getCreatedOn: () => Date
}>

// Factory function types
export interface IdService {
    makeId(): string;

    isValidId(id: string): boolean;
}

export interface MakeSourceFunction {
    (source: SourceInput): Source;
}

export interface MakeCommentFunction {
    (input: CommentInput): Comment;
}

export interface SourceDependencies {
    isValidIp(ip: string): boolean;
}

export interface CommentDependencies {
    Id: IdService;

    md5(input: string): string;

    sanitize(input: string): string;

    makeSource: MakeSourceFunction;
}

export interface CommentDTO {
    id: string;
    author: string;
    source: {
        ip: string;
        browser: string;
        referer?: string;
    };
    modifiedOn: Date;
    postId: string;
    published: boolean;
    replyToId?: string;
    text: string;
    hash: string;
}

export interface CommentRecord {
    id: string;
    text: string;
    author: string;
    post_id: string;
    reply_to_id?: string;
    published: boolean;
    created_at: Date;
    modified_on: Date;
    ip: string;
    browser: string;
    referer?: string;
    hash: string;
    deleted_at?: Date;
}

