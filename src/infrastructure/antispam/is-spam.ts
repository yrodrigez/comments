import { pipe } from "@shared/utils/pipe/pipe";
import queryString from 'querystring';
import { type Comment } from "@domain/comment/types";

export default function makeIsSpam({ issueHttpRequest }: { issueHttpRequest: any }) {
  return async function isSpam({ comment, testOnly = false }: { comment: Comment; testOnly?: boolean }) {
    try {
      const source = comment.getSource();
      const apiKey = process.env.AKISMET_API_KEY;
      
      if (!apiKey) {
        console.warn('AKISMET_API_KEY not configured, allowing comment');
        return false;
      }

      const command = buildAkismetApiCommand({
        author: comment.getAuthor(),
        browser: source.browser,
        createdOn: comment.getCreatedOn(),
        ip: source.ip,
        modifiedOn: comment.getModifiedOn(),
        querystring: queryString,
        referrer: source.referer || undefined,
        testOnly,
        text: comment.getText(),
        url: `https://${apiKey}.rest.akismet.com/1.1/comment-check`
      });

      const response = await issueHttpRequest(command);
      return pipe(response, normalizeModerationApiResponse);
    } catch (e: any) {
      console.error('Error checking for spam:', e);
      throw new Error('Failed to check for spam');
    }
  }
}

export function normalizeModerationApiResponse(response: { data: any }) {
  return response.data === 'true';
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
  referrer?: string | undefined,
  testOnly: boolean,
  text: string,
  url: string
  lang?: string | undefined
}) {
  return {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: process.env.DM_SPAM_API_URL || url,
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