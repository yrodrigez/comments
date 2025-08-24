import {createHash} from "crypto";
import Id from '../Id.js';
import ipRegex from "ip-regex";
import sanitizeHtml from "sanitize-html";
import buildMakeComment from "./comment.js";
import buildMakeSource from "./source.js";

const isValidIp = (ip: string) => {
    return ipRegex({exact: true}).test(ip);
}

const makeSource = buildMakeSource({isValidIp});

const sanitize = (input: string) => {
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
}

const md5 = (input: string) => {
    return createHash('md5').update(input, 'utf8').digest('hex');
}

const makeComment = buildMakeComment({
    Id,
    md5,
    sanitize,
    makeSource
})

export default makeComment;