import axios from "axios";
import { getTenantAccessToken } from "./larkService.js";

export const getLarkUsers = async () => {
  try {
    const token = await getTenantAccessToken();

    const response = await axios.get(
      "https://open.larksuite.com/open-apis/contact/v3/users?page_size=50&user_id_type=open_id",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};