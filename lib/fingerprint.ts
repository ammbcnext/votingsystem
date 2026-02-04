import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const loadFingerprint = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
};
