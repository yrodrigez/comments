import {pipe} from "@shared/utils/pipe/pipe";
import queryString from 'querystring';

export default function makeIsSpam({issueHttpRequest}: { issueHttpRequest: any }) {
    return async function isSpam({
                                     author,
                                     browser,
                                     createdOn,
                                     ip,
                                     modifiedOn,
                                     referrer,
                                     testOnly,
                                     text
                                 }: {
        author: string;
        browser: string;
        createdOn: Date;
        ip: string;
        modifiedOn: Date;
        referrer?: string;
        testOnly: boolean;
        text: string;
    }) {
        if (!text) {
            throw new Error('Content is required to check for spam');
        }
        const apiKey = process.env.AKISMET_API_KEY;
        if (!apiKey) {
            throw new Error('AKISMET_API_KEY is not set in environment variables');
        }
        const spamApi = pipe(
            buildAkismetApiCommand,
            issueHttpRequest,
            normalizeModerationApiResponse
        )

        try {
            return await spamApi({
                author,
                browser,
                createdOn,
                ip,
                modifiedOn,
                queryString,
                referrer,
                testOnly,
                text,
                url: `https://${apiKey}.rest.akismet.com/1.1/comment-check`
            });
        } catch (e: any) {
            console.error('Error checking for spam:', e);
            throw new Error('Failed to check for spam');
        }
    }
}

export function normalizeModerationApiResponse(response: { data: any }) {
    return (
        !response?.data?.Classification ||
        response?.data?.Classification?.ReviewRecommended
    )
}

export function buildAkismetApiCommand({
                                           author,
                                           browser,
                                           createdOn,
                                           ip,
                                           modifiedOn,
                                           querystring,
                                           referrer,
                                           testOnly,
                                           text,
                                           url,
                                           lang = 'en'
                                       }: {
    author: string,
    browser: string,
    createdOn: Date,
    ip: string,
    modifiedOn: Date,
    querystring: any,
    referrer?: string,
    testOnly: boolean,
    text: string,
    url: string
    lang?: string
}) {
    return {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        url: process.env.DM_SPAM_API_URL,
        method: 'post',
        data: querystring.stringify({
            blog: url,
            user_ip: ip,
            user_agent: browser,
            referrer,
            comment_type: 'comment',
            comment_author: author,
            comment_content: text,
            comment_date_gmt: new Date(createdOn).toISOString(),
            comment_post_modified_gmt: new Date(modifiedOn).toISOString(),
            blog_lang: lang,
            is_test: testOnly
        })
    }
}