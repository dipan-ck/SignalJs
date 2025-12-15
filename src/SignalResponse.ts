



class SignalResponse {

  private statusCode = 200;
  private headers = new Headers();
  sent = false;
  response?: Response;



  error(err: unknown, status = 500, message = "Internal Server Error") {
  if (this.sent) {
    throw new Error("Response already sent");
  }

  this.statusCode = status;
  this.headers.set("Content-Type", "application/json");

  this.response = new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status: status,
      headers: this.headers,
    }
  );

  this.sent = true;

  // IMPORTANT: throw so Signal catches it
  throw err;
}




  status(code: number) {
    this.statusCode = code;
    return this;
  }



  header(key: string, value: string) {
    this.headers.set(key, value);
    return this;
  }

  cookie(
    name: string,
    value: string,
    options?: {
      maxAge?: number;
      expires?: Date;
      path?: string;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }
  ) {

    if (options?.sameSite === "None" && !options.secure) {
  throw new Error("SameSite=None requires Secure");
}

let cookie = `${name}=${encodeURIComponent(value)}`;





    if (options?.maxAge !== undefined) {
      cookie += `; Max-Age=${options.maxAge}`;
    }

    if (options?.expires) {
      cookie += `; Expires=${options.expires.toUTCString()}`;
    }

    if (options?.path) {
      cookie += `; Path=${options.path}`;
    }

    if (options?.domain) {
      cookie += `; Domain=${options.domain}`;
    }

    if (options?.secure) {
      cookie += '; Secure';
    }

    if (options?.httpOnly) {
      cookie += '; HttpOnly';
    }

    if (options?.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    this.headers.append('Set-Cookie', cookie);
    return this;
  }


  clearCookie(name: string, path = "/") {
  this.cookie(name, "", {
    path,
    expires: new Date(0),
  });
  return this;
}



  json(data: unknown) {
    this.headers.set("Content-Type", "application/json");
    this.response = new Response(JSON.stringify(data), {
      status: this.statusCode,
      headers: this.headers
    });
    this.sent = true;
    return this.response;
  }



  text(body: string) {
    this.response = new Response(body, {
      status: this.statusCode,
      headers: this.headers
    });
    this.sent = true;
    return this.response;
  }



}


export default SignalResponse;  