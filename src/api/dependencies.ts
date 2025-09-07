import axios from 'axios';
import makeMockDatabase from '../infrastructure/db/mock-database';
import makeCommentsDb from '../services/data-access/comments/comment-repository';
import makeIsSpam from '../infrastructure/antispam/is-spam';
import makeModerationService from '../application/services/moderation-service';
import makeAddComment from '../application/use-cases/comment/add-comment';
import makeRemoveComment from '../application/use-cases/comment/remove-comment';
import makeListComments from '../application/use-cases/comment/list-comments';
import makeUpdateComment from '../application/use-cases/comment/update-comment';
import makeComment from '../domain/comment';

// Infrastructure dependencies
const database = makeMockDatabase();
const issueHttpRequest = axios;

// Data access layer
const commentsDb = makeCommentsDb({ makeDatabase: () => database });

// Infrastructure services
const isSpam = makeIsSpam({ issueHttpRequest });

// Application services  
const moderationService = makeModerationService({ 
  isSpam: async ({ comment, testOnly = false }) => {
    const result = await isSpam({ comment, testOnly });
    return typeof result === 'boolean' ? result : false;
  }
});

// Use cases
const addComment = makeAddComment({
  commentsDb: {
    findByHash: async ({ hash }) => {
      const result = await commentsDb.findByHash(hash);
      if (!result) return null;
      
      // Convert CommentRecord to Comment
      return makeComment({
        id: result.id,
        author: result.author,
        text: result.text,
        postId: result.post_id,
        replyToId: result.reply_to_id || undefined,
        published: result.published,
        createdOn: result.created_on,
        modifiedOn: result.modified_on,
        source: {
          ip: result.ip,
          browser: result.browser,
          referer: result.referer || undefined
        }
      });
    },
    insert: async (commentInput) => {
      const comment = makeComment(commentInput);
      const result = await commentsDb.insert(comment);
      return makeComment({
        id: result.id,
        author: result.author,
        text: result.text,
        postId: result.post_id,
        replyToId: result.reply_to_id || undefined,
        published: result.published,
        createdOn: result.created_on,
        modifiedOn: result.modified_on,
        source: {
          ip: result.ip,
          browser: result.browser,
          referer: result.referer || undefined
        }
      });
    }
  },
  handleModeration: moderationService
});

const removeComment = makeRemoveComment({ commentsDb });
const listComments = makeListComments({ commentsDb });
const updateComment = makeUpdateComment({
  commentsDb,
  handleModeration: moderationService
});

export {
  addComment,
  removeComment,
  listComments,
  updateComment
};