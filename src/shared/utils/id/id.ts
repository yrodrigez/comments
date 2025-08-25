import {createId, isCuid} from "@paralleldrive/cuid2";

export default Object.freeze({
    makeId: createId,
    isValidId: isCuid
});