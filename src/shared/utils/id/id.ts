import {createId, isCuid} from "@paralleldrive/cuid2";
import { CommentId, PostId } from "@shared/types";

// Type guards for branded IDs
function isCommentId(id: string): id is CommentId {
    return isCuid(id);
}

function isPostId(id: string): id is PostId {
    return isCuid(id);
}

const commentIdService = Object.freeze({
    makeId: (): CommentId => createId() as CommentId,
    isValidId: isCommentId
});

const postIdService = Object.freeze({
    makeId: (): PostId => createId() as PostId,
    isValidId: isPostId
});

// Legacy support - keeping the original interface
export default Object.freeze({
    makeId: createId,
    isValidId: isCuid
});

export { commentIdService, postIdService };