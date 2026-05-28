import axios from "axios";

export const getTenantAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal",
      {
        app_id: process.env.LARK_APP_ID,
        app_secret: process.env.LARK_APP_SECRET
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log(response.data);

    return response.data.tenant_access_token;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};