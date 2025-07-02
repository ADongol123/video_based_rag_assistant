const BASE_URL = "http://127.0.0.1:8000"; // your FastAPI backend

// Helper for building query strings (optional)
function buildQueryString(params?: Record<string, string | number | boolean>): string {
  if (!params) return "";
  return (
    "?" +
    Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function apiRequest(
  endpoint: string,
  method: HttpMethod = "GET",
  data: Record<string, any> | URLSearchParams | null = null,
  token: string | null = null,
  params?: Record<string, string | number | boolean>,
  contentType: string = "application/json"
): Promise<any> {
  const url = BASE_URL + endpoint + buildQueryString(params);

  const headers: Record<string, string> = {};

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    if (contentType === "application/json") {
      options.body = JSON.stringify(data);
    } else if (contentType === "application/x-www-form-urlencoded") {
      // If data is already URLSearchParams, convert to string
      if (data instanceof URLSearchParams) {
        options.body = data.toString();
      } else {
        options.body = new URLSearchParams(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ).toString();
      }
    } else {
      // fallback: send data as is (string or FormData)
      options.body = data as BodyInit;
    }
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "API error");
  }

  const responseContentType = res.headers.get("content-type") || "";
  if (responseContentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

// Updated apiPost to accept contentType as optional parameter
export async function apiPost(
  endpoint: string,
  data: Record<string, any> | URLSearchParams,
  token: string | null = null,
  contentType: string = "application/json"
): Promise<any> {
  return apiRequest(endpoint, "POST", data, token, undefined, contentType);
}
