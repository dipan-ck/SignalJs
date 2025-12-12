import SignalRequest from "./SignalRequest";

export type HttpHeaders = Record<string, string>;
const queryParams: Record<string, string> = {};

export interface ParsedRequest {
  method: string;
  path: string;
  query?: Record<string, string>; // optional query parameters
  version: string;
  headers: HttpHeaders;
  body?: string;
}

class HttpParser {
  // Splits the raw HTTP request into header and body
  splitHeaders(req: string) {
    const [header, body = ""] = req.split("\r\n\r\n");
    return { header, body };
  }

  parseHeader(req: string): SignalRequest {


    const { header , body } = this.splitHeaders(req);

    if(!header) throw new Error("Invalid HTTP Request: No headers found");

    const headerLines = header.split("\r\n");

    const [method, path, version] = (headerLines[0] || "").split(" ");

    // Parse headers
    const headers: HttpHeaders = {};

    for (const line of headerLines.slice(1)) {
      const [key, ...rest] = line.split(":");
      if (!key) continue;
      headers[key.trim().toLowerCase()] = rest.join(":").trim(); // lowercase keys
    }

    //parse the urkl query parameters
    const queryString = (path || "").split("?")[1];

    const query: Record<string, string> = {};

    if (queryString) {
      for (const pair of queryString.split("&")) {
        const [key, value] = pair.split("=");
        if (key && value) {
          query[key.toLowerCase().trim()] = value.toLowerCase().trim();
        }
      }
    }

    return new SignalRequest({
      method: method || "",
      query,
      path: path || "",
      version: version || "",
      headers,
      body: body || undefined,
    });
  }
}

export default HttpParser;
