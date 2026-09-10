


import axios from "axios";
import { BASE_URL } from "./client.js";

const reportClient = axios.create({
  baseURL: `${BASE_URL}/api/reports`,
});

export default reportClient;