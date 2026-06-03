export const MEDIA_BASE_URL = "http://14.225.192.37:8085";

// encodeURI is not idempotent — calling it on an already-encoded string double-encodes
// percent sequences (%20 → %2520). Only encode when we are constructing the URL ourselves.
export const getFullUrl = (url: string) => {
    if (!url) return "";

    // Already absolute — return as-is to avoid double-encoding any pre-encoded chars
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    // Relative path starting with /uploads
    if (url.startsWith("/uploads")) {
        return encodeURI(`${MEDIA_BASE_URL}${url}`);
    }

    // Bare filename (e.g. "48662f19-abc.png") — insert /uploads/ prefix
    const cleanUrl = url.replace(/^\/+/, "");
    if (!cleanUrl.startsWith("uploads/")) {
        return encodeURI(`${MEDIA_BASE_URL}/uploads/${cleanUrl}`);
    }

    return encodeURI(`${MEDIA_BASE_URL}/${cleanUrl}`);
};
