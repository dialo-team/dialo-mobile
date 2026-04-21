const axios = require("axios");

const BASE_URL = "http://14.225.254.174:9000";

const USERS = {
    USER_1: {
        id: "8b2b5711-7609-4a93-96dd-29e7d95ee428",
        accessToken:
            "eyJhbGciOiJSUzI1NiJ9.eyJqdGkiOiI2MWQ2M2E1NC1lODg0LTQ1OGEtOTUzMC0wNDFkMDVlMjM3NjMiLCJ0b2tlbl90eXBlIjoiQUNDRVNTX1RPS0VOIiwic3ViIjoiOGIyYjU3MTEtNzYwOS00YTkzLTk2ZGQtMjllN2Q5NWVlNDI4IiwiaWF0IjoxNzc2NzY3MTY5LCJleHAiOjE3NzY4NTM1Njl9.tzm5QntSInDwc0QzOlviqwMPt4wdAeHIOt5JVJZTopPavZDeoqaNay52E2jkblzIvsAYhICjy025qyt0Cw7rGfkihuODUejv3rOMBrw-RlqTZvg82tEtq8kcRv-Im85WRwcxzhUo02b3pBjljMHmdldOmZuuOJqgVdyUu9GZtzXVWJq6XMYXa7uV2h6CRoj14t4JOE88qFJM2pZ1oEh01YOx0prw8tcTaBGgJNNv_RMyiGqkAXCbm-LVwkDLomSFl-Qn9hIdIT5W0tuKSAtOsysJJagDWj26f2AYblxmKubZEtOTOfS7vnhzwHE7nKIRUDhNApkt34MJnO-abEc1pA",
    },
    USER_2: {
        id: "a67556e2-4d23-400e-a584-a331139502a9",
        accessToken:
            "eyJhbGciOiJSUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiQUNDRVNTX1RPS0VOIiwianRpIjoiYzBhYzQ4YjQtMjM1ZS00ZDU0LWJjYTctYTUxM2FmNjI0MDQ1Iiwic3ViIjoiYTY3NTU2ZTItNGQyMy00MDBlLWE1ODQtYTMzMTEzOTUwMmE5IiwiaWF0IjoxNzc2NzY5MTM4LCJleHAiOjE3NzY4NTU1Mzh9.itEX5_KimChQ5oKB-qm9Q2J56-cO49cwyKjv3j9T_xSTEQkiJ25wWBkeJFZ-4bWEBHA615tlhv39t7Fwbx-_XX15hMSdqxGPnWZS59ZXSn2_MyTbYSkTtb5D7BOerpBhLq48Xy8RlyH1rwuJmam5RN_6jyiRHjoqZDbjEt6Y0y292dCpeIZ2hK0BUjFzvLhtqJ1LKi_k-eiUPwUdT49SQ8Cneumncg_DhmvGpn51rcoP9K947IVSX6gTnZDydFHKlB5M4FC2zju1PAwAIR9nbPsI2VpFFmKHYE3m-VnNcvsVP-W0yHM91N8fsu3Lwlt6a4mk1AURdgonjQ7OJaWXrA",
    },
    USER_3: {
        id: "39304acb-e9a1-43f1-81f8-7188d9d4b79f",
        accessToken:
            "eyJhbGciOiJSUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiQUNDRVNTX1RPS0VOIiwianRpIjoiODI5NjAwNzEtZTEwZi00MTE4LWIzMWUtMWU2OTVjZWZiOTQ1Iiwic3ViIjoiMzkzMDRhY2ItZTlhMS00M2YxLTgxZjgtNzE4OGQ5ZDRiNzlmIiwiaWF0IjoxNzc2NzY5MjIyLCJleHAiOjE3NzY4NTU2MjJ9.GGqqEZPZ8Y3T4GANkEdHZvjAiEeshzMtHmzoLicwG8Y9FKpco0sjwwgM3GKlzgFRdCYSvKS317H612oLBX9bpZriWZNdcBvTIpl4FShAmfO9Z3ISbCa1SJ_N-MAyTYRkzpLMDBod2nHh7rHwAiZxwlLAfXwhoQX4_r-aHlsGG4inpL6W5DKRQcnkHz4pKjX2wlanHrGpbtQ-2CKYZpDksBYvYI92Lhie-tMsVjW8Itc8Hq5nUGIax5drtcCGOSN9NA2OT56oyOKI0MyebQC1RC01Ll2rCtIPeHHc1xddELvQMJzlmlnnfaKMRMELg3SpIxu_OMXWtCn9VXmAHk_uEg",
    },
    USER_4: {
        id: "fda27913-d3e8-4a9b-9efc-edd6108fade9",
        accessToken: null,
    },
};

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

async function createGroup(actor) {
    const res = await http(actor).post("/api/v1/conversations/groups", {
        name: "Nhóm test group api",
        memberIds: [USERS.USER_2.id, USERS.USER_3.id],
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

async function runDemo() {
    try {
        const owner = USERS.USER_1;
        const user2 = USERS.USER_2;
        const user3 = USERS.USER_3;
        const user4 = USERS.USER_4;

        const group = await createGroup(owner);
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

        const added = await addMembers(owner, groupId, [user4.id]);
        logStep("5. ADD USER_4 BY USER_1", added);

        const members2 = await getGroupMembers(owner, groupId);
        logStep("6. MEMBERS AFTER ADD USER_4 (USER_1)", members2);

        const toAdmin = await assignRole(owner, groupId, user2.id, "ADMIN");
        logStep("7. ASSIGN USER_2 => ADMIN BY USER_1", toAdmin);

        try {
            await leaveGroup(owner, groupId);
            console.log(
                "\n========== 8. OWNER LEAVE BEFORE TRANSFER ==========",
            );
            console.log("UNEXPECTED: owner left group before transfer");
        } catch (error) {
            logExpectedError("8. OWNER LEAVE BEFORE TRANSFER (USER_1)", error);
        }

        const transferOwner = await assignRole(
            owner,
            groupId,
            user2.id,
            "OWNER",
        );
        logStep("9. TRANSFER OWNER TO USER_2 BY USER_1", transferOwner);

        const members3 = await getGroupMembers(user2, groupId);
        logStep("10. MEMBERS AFTER TRANSFER OWNER (USER_2)", members3);

        const oldOwnerLeave = await leaveGroup(owner, groupId);
        logStep("11. OLD OWNER LEAVE AFTER TRANSFER (USER_1)", oldOwnerLeave);

        const members4 = await getGroupMembers(user2, groupId);
        logStep("12. MEMBERS AFTER USER_1 LEAVE (USER_2)", members4);

        const detailByUser3 = await getConversationDetail(user3, groupId);
        logStep("13. DETAIL BY USER_3", detailByUser3);

        const removeUser4 = await removeMember(user2, groupId, user4.id);
        logStep("14. OWNER NEW REMOVE USER_4 BY USER_2", removeUser4);

        const finalDetail = await getConversationDetail(user2, groupId);
        logStep("15. FINAL DETAIL BY USER_2", finalDetail);

        const dissolved = await dissolveGroup(user2, groupId);
        logStep("16. DISSOLVE GROUP BY USER_2", dissolved);

        try {
            const detailAfterDissolve = await getConversationDetail(
                user2,
                groupId,
            );
            logStep("17. DETAIL AFTER DISSOLVE (USER_2)", detailAfterDissolve);
        } catch (error) {
            logExpectedError("17. DETAIL AFTER DISSOLVE (USER_2)", error);
        }
    } catch (error) {
        logError("RUN DEMO", error);
    }
}

runDemo();
