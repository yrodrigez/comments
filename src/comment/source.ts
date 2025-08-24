export default function buildMakeSource({isValidIp}: { isValidIp: (ip: string) => boolean }) {
    return function makeSource({ip, browser, referer}: { ip: string, browser: string, referer?: string }) {
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