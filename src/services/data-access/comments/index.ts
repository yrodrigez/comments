import commentsDb from '@services/data-access/comments/comment-repository';
import makeDatabase from '@infrastructure/db/postgre-database';

export default commentsDb({makeDatabase});