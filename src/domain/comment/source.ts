import {type SourceInput} from "@domain/comment/types";

export default function buildMakeSource({isValidIp}: { isValidIp: (ip: string) => boolean }) {
    return function makeSource({ip, browser, referer}: SourceInput) {
        if (!isValidIp(ip)) {
            throw new Error('Invalid IP address');
        }
        if (!browser || browser.trim().length === 0) {
            throw new Error('Browser information is required');
        }

        return Object.freeze({
            getIp: () => ip,
            getBrowser: () => browser,
            getReferer: () => referer
        });
    }
}