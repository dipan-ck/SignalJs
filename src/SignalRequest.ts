class SignalRequest {
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string | undefined;

  constructor({
    method,
    path,
    version,
    headers,
    query,
    body,
  }: {
    method: string;
    path: string;
    version: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body?: string;
  }) {
    this.method = method;
    this.path = path;
    this.version = version;
    this.headers = headers;
    this.query = query;
    this.body = body;
  }

  getHeader(header: string) {
    return this.headers[header.toLocaleLowerCase()];
  }

  queryParams(query: string) {
    return this.query[query.toLocaleLowerCase()];
  }

  json() {
    if (this.body) {
      if (this.headers["content-type"] !== "application/json") {
        throw new Error("Content-Type is not application/json");
      }
      return JSON.parse(this.body);
    }

    throw new Error("No body found");
  }


  
  text() {
    return this.body;
  }
}

export default SignalRequest;
