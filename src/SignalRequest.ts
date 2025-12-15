class SignalRequest {
  private raw: Request;
  private url: URL;

  path: string;
  query: URLSearchParams;
  params: Record<string, string> = {}
  body: any;

  private _bodyUsed = false;
  private _jsonBody: any;
  private _textBody: string | undefined;
  private _cookies?: Record<string, string>;


  constructor(req: Request) {
    this.raw = req;
    this.url = new URL(req.url);
    this.path = this.url.pathname;
    this.query = this.url.searchParams;
    this.params = {};
  }

  // HTTP method
  get method() {
    return this.raw.method;
  }

  // Full URL
  get origin() {
    return this.raw.url;
  }

  // Headers
  get headers() {
    return this.raw.headers;
  }

  header(name: string) {
    return this.raw.headers.get(name);
  }

  // Get a specific cookie value
cookie(name: string): string | undefined {
  return this.cookies()[name];
}

  // Get all cookies as an object
cookies(): Record<string, string> {
  if (this._cookies) return this._cookies;

  const cookieHeader = this.raw.headers.get("Cookie");
  const result: Record<string, string> = {};

  if (!cookieHeader) {
    this._cookies = result;
    return result;
  }

  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) continue;
    result[key] = decodeURIComponent(valueParts.join("="));
  }

  this._cookies = result;
  return result;
}

  // Safe JSON body (cached)
  async json<T = any>(): Promise<T> {
    if (this._bodyUsed) return this._jsonBody;
    this._bodyUsed = true;
    this._jsonBody = await this.raw.json();
    return this._jsonBody;
  }

  // Safe text body (cached)
  async text(): Promise<string> {
    if (this._bodyUsed) return this._textBody!;
    this._bodyUsed = true;
    this._textBody = await this.raw.text();
    return this._textBody;
  }

  setParam(key: string, value: string){
    this.params[key] = value;
  }


}

export default SignalRequest;
