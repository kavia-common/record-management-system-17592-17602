//
// Centralized API client for the record management frontend
//
import axios from "axios";

const API_BASE_URL = "http://localhost:3001";

// PUBLIC_INTERFACE
export const api = {
  /** Fetch all records */
  // PUBLIC_INTERFACE
  async listRecords(signal) {
    const res = await axios.get(`${API_BASE_URL}/records`, { signal });
    return res.data;
  },

  /** Create a new record */
  // PUBLIC_INTERFACE
  async createRecord(payload) {
    const res = await axios.post(`${API_BASE_URL}/records`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  },

  /** Update an existing record by id */
  // PUBLIC_INTERFACE
  async updateRecord(id, payload) {
    const res = await axios.put(`${API_BASE_URL}/records/${id}`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  },

  /** Delete a record by id */
  // PUBLIC_INTERFACE
  async deleteRecord(id) {
    const res = await axios.delete(`${API_BASE_URL}/records/${id}`);
    return res.data;
  },
};

export default api;
