export function normalizePhoneTo84(phone: string) {
    if (!phone) return "";

    if (phone.startsWith("+")) return phone;
    if (phone.startsWith("0")) return `+84${phone.slice(1)}`;
    return `+84${phone}`;
}

export function maskPhone(
    phone: string,
    pattern: RegExp = /(\d{3})\d{3}(\d{3})/,
) {
    if (!phone) return "";
    return phone.replace(pattern, "$1***$2");
}

export function isValidVietnamPhone(phone: string) {
    return (
        (phone.startsWith("0") && phone.length === 10) ||
        (!phone.startsWith("0") && phone.length === 9)
    );
}

export function keepPhoneDigitsOnly(input: string) {
    const numbersOnly = input.replace(/[^0-9]/g, "");

    if (numbersOnly.startsWith("0")) {
        return numbersOnly.slice(0, 10);
    }

    if (numbersOnly.length > 0) {
        return numbersOnly.slice(0, 9);
    }

    return "";
}
