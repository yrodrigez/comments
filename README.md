# Comments Microservice

A clean architecture microservice for managing comments with anti-spam functionality using Akismet.

## Features

- **Clean Architecture**: Separation of concerns with Domain, Application, Infrastructure, and API layers
- **Anti-spam Protection**: Integration with Akismet for automatic spam detection
- **CRUD Operations**: Complete comment lifecycle management
- **Soft Delete**: Comments are marked as deleted rather than permanently removed
- **Input Validation**: Comprehensive validation and sanitization
- **Type Safety**: Full TypeScript implementation

## Architecture

```
src/
├── api/                    # API layer (HTTP handlers, dependency injection)
├── application/            # Application layer (use cases, services)
│   ├── services/          # Application services (moderation)
│   └── use-cases/         # Business use cases
├── domain/                # Domain layer (entities, business logic)
├── infrastructure/        # Infrastructure layer (database, external APIs)
│   ├── antispam/         # Akismet integration
│   └── db/               # Database implementations
├── services/              # Services layer (repositories)
│   └── data-access/      # Data access implementations
└── shared/                # Shared utilities and types
```

## API Endpoints

### POST /api/comments
Add a new comment with automatic spam checking.

**Request Body:**
```json
{
  "author": "John Doe",
  "text": "This is a great post!",
  "postId": "blog-post-123",
  "replyToId": "parent-comment-id",  // optional
  "published": true                   // optional, defaults to false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment-id",
    "author": "John Doe",
    "text": "This is a great post!",
    // ... other fields
  }
}
```

### GET /api/comments
List comments for a post or all comments.

**Query Parameters:**
- `postId` (optional): Filter comments by post ID
- `publishedOnly` (optional): Return only published comments (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-id",
      "author": "John Doe",
      "text": "This is a great post!",
      // ... other fields
    }
  ]
}
```

### PUT /api/comments
Update an existing comment.

**Request Body:**
```json
{
  "id": "comment-id",
  "updates": {
    "text": "Updated comment text",
    "published": false
  }
}
```

### DELETE /api/comments
Soft delete a comment (marks as deleted, doesn't remove from database).

**Request Body:**
```json
{
  "id": "comment-id"
}
```

## Use Cases

### addComment
- Validates comment input
- Checks for duplicate comments using hash
- Runs anti-spam moderation using Akismet
- Stores comment in database
- Returns moderated comment

### removeComment
- Validates comment exists
- Performs soft delete (sets deleted_at timestamp)
- Returns deleted comment record

### listComments
- Retrieves comments for a specific post or all comments
- Filters out soft-deleted comments
- Supports published-only filtering

### updateComment
- Validates comment exists
- Merges updates with existing data
- Runs moderation on updated comment
- Stores updated comment

## Environment Variables

### Required for Production
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

### Optional
- `AKISMET_API_KEY`: Akismet API key for spam detection
- `DM_SPAM_API_URL`: Custom spam detection API URL
- `PORT`: Server port (default: 3000)

## Development

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
npm test
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Database Schema

```sql
CREATE TABLE comments (
  id VARCHAR PRIMARY KEY,
  text TEXT NOT NULL,
  author VARCHAR NOT NULL,
  post_id VARCHAR NOT NULL,
  reply_to_id VARCHAR,
  published BOOLEAN DEFAULT false,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR NOT NULL,
  browser VARCHAR NOT NULL,
  referer VARCHAR,
  hash VARCHAR NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_hash ON comments(hash);
CREATE INDEX idx_comments_deleted_at ON comments(deleted_at);
```

## Anti-spam Integration

The microservice integrates with Akismet for automatic spam detection:

1. When a comment is added or updated, it's sent to Akismet for analysis
2. Akismet analyzes the comment content, author, IP, and other metadata
3. If spam is detected, the comment can be marked as unpublished for review
4. If Akismet is not configured, comments are allowed by default

## Testing

The project includes comprehensive tests for:
- Domain entities (Comment)
- Data access layer (Repository)
- Use cases (Add, Remove, List, Update)
- Type safety and validation
- Error handling

Run tests with coverage:
```bash
npm run test:coverage
```

## Clean Architecture Benefits

1. **Independence**: Business logic doesn't depend on frameworks or external services
2. **Testability**: Each layer can be tested in isolation
3. **Flexibility**: Easy to swap implementations (e.g., different databases)
4. **Maintainability**: Clear separation of concerns makes code easier to understand and modify
5. **Scalability**: Architecture supports growth and changing requirements