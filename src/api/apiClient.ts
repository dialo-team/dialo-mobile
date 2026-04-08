import axios from "axios";

const BASE_URL = "http://14.225.254.174:8082/api/v1";

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

export default apiClient;
