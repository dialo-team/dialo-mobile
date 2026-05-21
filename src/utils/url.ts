export const BASE_URL = "http://14.225.192.37:8085";

export const getFullUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
};
