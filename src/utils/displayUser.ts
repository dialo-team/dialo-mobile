const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i;
const DIGITS_ONLY_REGEX = /^\d+$/;
const PHONE_LIKE_REGEX = /^\+?\d[\d\s.-]{5,}$/;

function sanitizeName(value?: string | null): string {
    const raw = value == null ? "" : String(value);
    const trimmed = raw.trim();
    if (!trimmed) return "";

    const lowered = trimmed.toLowerCase();
    if (lowered === "undefined" || lowered === "null" || lowered === "0") {
        return "";
    }

    if (trimmed === "0") {
        return "";
    }

    if (UUID_REGEX.test(trimmed) || OBJECT_ID_REGEX.test(trimmed)) {
        return "";
    }

    // Avoid rendering backend IDs or phone-like numeric values as display names.
    const compact = trimmed.replace(/[\s.-]/g, "");
    if (DIGITS_ONLY_REGEX.test(compact)) {
        return "";
    }

    if (PHONE_LIKE_REGEX.test(trimmed) && compact.length >= 6) {
        return "";
    }

    return trimmed;
}

export function pickBestDisplayName(
    candidates: (string | null | undefined)[],
    fallback = "Nguoi dung",
): string {
    for (const candidate of candidates) {
        const name = sanitizeName(candidate);
        if (name) return name;
    }
    return fallback;
}

export function getInitials(name?: string | null, fallback = "U"): string {
    const cleaned = sanitizeName(name);
    if (!cleaned) return fallback;

    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 0) return fallback;
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase();

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
