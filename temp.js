const { Buffer } = require("buffer");
const axios = require("axios");

const BASE_URL = "http://14.225.192.37:9000";

const ACCOUNTS = {
    OWNER: {
        phone: "0369021946",
        password: "123456",
    },
    USER_2: {
        phone: "0369021947",
        password: "123456",
    },
    USER_3: {
        phone: "0369021948",
        password: "123456",
    },
};

const TARGET_USERS = {
    USER_4: {
        id: "fda27913-d3e8-4a9b-9efc-edd6108fade9",
    },
};

function normalizePhone(input) {
    const digits = String(input || "").replace(/\D/g, "");

    if (digits.startsWith("84")) {
        return `0${digits.slice(2)}`;
    }

    if (!digits.startsWith("0")) {
        return `0${digits}`;
    }

    return digits;
}

function decodeJwtPayload(token) {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return {};

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
    );

    try {
        return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    } catch {
        return {};
    }
}

async function login(account) {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/signin`, {
        phone: normalizePhone(account.phone),
        password: account.password,
    });

    const root = response?.data ?? response;
    const payload = root?.data ?? root?.result ?? root;
    const accessToken = payload?.accessToken ?? payload?.access_token;
    const refreshToken = payload?.refreshToken ?? payload?.refresh_token ?? "";

    if (!accessToken || typeof accessToken !== "string") {
        throw new Error(
            `Login did not return access token for ${account.phone}`,
        );
    }

    const jwt = decodeJwtPayload(accessToken);
    const id = jwt?.sub || jwt?.userId || jwt?.id;

    if (!id) {
        throw new Error(
            `Could not decode user id from access token for ${account.phone}`,
        );
    }

    return {
        id,
        accessToken,
        refreshToken,
        phone: account.phone,
    };
}

function http(user) {
    return axios.create({
        baseURL: BASE_URL,
        timeout: 30000,
        headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "X-User-Id": user.id,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
}

function logStep(title, data) {
    console.log(`\n========== ${title} ==========`);

    if (data === undefined || data === null || data === "") {
        console.log("No data");
        return;
    }

    try {
        console.log(JSON.stringify(data, null, 2));
    } catch {
        console.log(data);
    }
}

function logExpectedError(title, error) {
    console.log(`\n========== ${title} ==========`);

    if (error.response) {
        console.log("EXPECTED ERROR STATUS:", error.response.status);
        console.log(JSON.stringify(error.response.data, null, 2));
        return;
    }

    console.log("EXPECTED ERROR:", error.message || error);
}

function logError(title, error) {
    console.error(`\n========== ERROR: ${title} ==========`);

    if (error.response) {
        console.error("Status:", error.response.status);
        console.error(JSON.stringify(error.response.data, null, 2));
        return;
    }

    console.error(error.message || error);
}

async function createGroup(actor, memberIds) {
    const res = await http(actor).post("/api/v1/conversations/groups", {
        name: "Nhóm test group api",
        memberIds,
    });
    return res.data;
}

async function getConversationDetail(actor, conversationId) {
    const res = await http(actor).get(
        `/api/v1/conversations/${conversationId}`,
    );
    return res.data;
}

async function getGroupMembers(actor, conversationId) {
    const res = await http(actor).get(
        `/api/v1/conversations/${conversationId}/members`,
    );
    return res.data;
}

async function updateGroupName(actor, conversationId, groupName) {
    const res = await http(actor).put(
        `/api/v1/conversations/${conversationId}/group-name`,
        {
            groupName,
        },
    );
    return res.data;
}

async function addMembers(actor, conversationId, memberIds) {
    const res = await http(actor).post(
        `/api/v1/conversations/${conversationId}/members`,
        {
            memberIds,
        },
    );
    return res.data;
}

async function removeMember(actor, conversationId, memberId) {
    const res = await http(actor).delete(
        `/api/v1/conversations/${conversationId}/members/${memberId}`,
    );
    return res.data;
}

async function assignRole(actor, conversationId, memberId, role) {
    const res = await http(actor).put(
        `/api/v1/conversations/${conversationId}/members/${memberId}/role`,
        {
            role,
        },
    );
    return res.data;
}

async function leaveGroup(actor, conversationId) {
    const res = await http(actor).post(
        `/api/v1/conversations/${conversationId}/leave`,
        {},
    );
    return res.data;
}

async function dissolveGroup(actor, conversationId) {
    const res = await http(actor).delete(
        `/api/v1/conversations/${conversationId}/dissolve`,
    );
    return res.data;
}

async function updateGroupAvatar(actor, conversationId, groupAvatarUrl) {
    const res = await http(actor).put(
        `/api/v1/conversations/${conversationId}/group-avatar`,
        {
            groupAvatarUrl,
        },
    );
    return res.data;
}

async function runDemo() {
    try {
        const owner = await login(ACCOUNTS.OWNER);
        const user2 = await login(ACCOUNTS.USER_2);
        const user3 = await login(ACCOUNTS.USER_3);
        const user4 = TARGET_USERS.USER_4;

        logStep("LOGIN OWNER", { phone: owner.phone, id: owner.id });
        logStep("LOGIN USER_2", { phone: user2.phone, id: user2.id });
        logStep("LOGIN USER_3", { phone: user3.phone, id: user3.id });

        const group = await createGroup(owner, [user2.id, user3.id]);
        const groupId = group.id;
        logStep("1. CREATE GROUP BY USER_1", group);

        const detail1 = await getConversationDetail(owner, groupId);
        logStep("2. DETAIL AFTER CREATE (USER_1)", detail1);

        const members1 = await getGroupMembers(owner, groupId);
        logStep("3. GET GROUP MEMBERS (USER_1)", members1);

        const renamed = await updateGroupName(
            owner,
            groupId,
            "Nhóm test group api - đã đổi tên",
        );
        logStep("4. UPDATE GROUP NAME BY USER_1", renamed);

        const avatarPayload =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2tXc8AAAAASUVORK5CYII=";
        const avatarUpdated = await updateGroupAvatar(
            owner,
            groupId,
            avatarPayload,
        );
        logStep("5. UPDATE GROUP AVATAR BY USER_1", avatarUpdated);

        const added = await addMembers(owner, groupId, [user4.id]);
        logStep("6. ADD USER_4 BY USER_1", added);

        const members2 = await getGroupMembers(owner, groupId);
        logStep("7. MEMBERS AFTER ADD USER_4 (USER_1)", members2);

        const toAdmin = await assignRole(owner, groupId, user2.id, "ADMIN");
        logStep("8. ASSIGN USER_2 => ADMIN BY USER_1", toAdmin);

        try {
            await leaveGroup(owner, groupId);
            console.log(
                "\n========== 9. OWNER LEAVE BEFORE TRANSFER ==========",
            );
            console.log("UNEXPECTED: owner left group before transfer");
        } catch (error) {
            logExpectedError("9. OWNER LEAVE BEFORE TRANSFER (USER_1)", error);
        }

        const transferOwner = await assignRole(
            owner,
            groupId,
            user2.id,
            "OWNER",
        );
        logStep("10. TRANSFER OWNER TO USER_2 BY USER_1", transferOwner);

        const members3 = await getGroupMembers(user2, groupId);
        logStep("11. MEMBERS AFTER TRANSFER OWNER (USER_2)", members3);

        const oldOwnerLeave = await leaveGroup(owner, groupId);
        logStep("12. OLD OWNER LEAVE AFTER TRANSFER (USER_1)", oldOwnerLeave);

        const members4 = await getGroupMembers(user2, groupId);
        logStep("13. MEMBERS AFTER USER_1 LEAVE (USER_2)", members4);

        const detailByUser3 = await getConversationDetail(user3, groupId);
        logStep("14. DETAIL BY USER_3", detailByUser3);

        const removeUser4 = await removeMember(user2, groupId, user4.id);
        logStep("15. OWNER NEW REMOVE USER_4 BY USER_2", removeUser4);

        const finalDetail = await getConversationDetail(user2, groupId);
        logStep("16. FINAL DETAIL BY USER_2", finalDetail);

        const dissolved = await dissolveGroup(user2, groupId);
        logStep("17. DISSOLVE GROUP BY USER_2", dissolved);

        try {
            const detailAfterDissolve = await getConversationDetail(
                user2,
                groupId,
            );
            logStep("18. DETAIL AFTER DISSOLVE (USER_2)", detailAfterDissolve);
        } catch (error) {
            logExpectedError("18. DETAIL AFTER DISSOLVE (USER_2)", error);
        }
    } catch (error) {
        logError("RUN DEMO", error);
    }
}

runDemo();
