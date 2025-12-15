import {type ZodSchema } from "zod";
import http from "http";
import Context from "./Context";
import Routing, { type ExecutionResult, type HTTPMethod } from "./Routing";
import type SignalRequest from "./SignalRequest";
import { Readable } from "stream";


type CorsOptions = {
  origin?: string | string[] | ((origin: string | undefined) => boolean);
  methods?: HTTPMethod[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
};


class Signal {
  globalMiddlewares: Function[] = [];
  routing = new Routing();
  private isLogRequests = false;

  private handleError(err: Error, c: Context) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }

  onError(fn: (err: Error, c: Context) => Response) {
    this.handleError = fn;
  }

  listen(port: number, cb?: () => void) {
    const server = http.createServer(async (req, res) => {
      let body: string | null = null;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks).toString();
      }
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers as any,
        body,
      });

      const response = await this.handle(request);

      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(await response.text());
    });

    server.listen(port, cb);
  }

  async handle(req: Request) {
    const c = new Context(req);
    c.req.params = {};

    if (this.isLogRequests) {
      console.log(`${c.req.method} ${c.req.path}`);
    }

    try {
      // Ask router + build execution stack
      const result = this.getExecutionStack(c.req);
      c.req.params = result.params ?? {};

      // Run middleware + handler (if any)
      await this.executeStack(result.stack, c, 0);

      // If any middleware or handler sent a response, return it
      if (c.res.response) {
        return c.res.response;
      }

      // No response → routing error
      if (result.type === "METHOD_NOT_ALLOWED") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: {
            Allow: result.allow?.join(", ") || "",
          },
        });
      }

      // Default case
      return new Response("Not Found", { status: 404 });
    } catch (err: Error | any) {
      // If a response was already set (e.g., by c.res.error()), return it
      if (c.res.response) {
        return c.res.response;
      }
      return this.handleError(err, c);
    }
  }

  router() {
    return this.routing;
  }

  use(pathOrMiddleware: string | Function | Routing, ...middlewares: (Function | Routing)[]) {
    //if middleware is added using app.use(middleware) it will be treated as global middleware and added in globalMiddlewares array
    if (pathOrMiddleware instanceof Function) {
      this.globalMiddlewares.push(pathOrMiddleware);
      return;
    }

    // Check if we're mounting a router
    if (pathOrMiddleware instanceof Routing) {
      throw new Error("Cannot mount router without a path. Use app.use('/path', router)");
    }

    // if middleware is added using app.use("/path", middleware) it will be added to that path in the routing trie
    const node = this.routing.createRoute(
      pathOrMiddleware,
      this.routing.RootRoutingNode
    );

    // Check if any middleware is a Routing instance (sub-router)
    for (const middleware of middlewares) {
      if (middleware instanceof Routing) {
        // Mount the router's routes at this path
        this.routing.mountRouter(pathOrMiddleware, middleware);
      } else {
        // Regular middleware
        node.middlewares.push(middleware);
      }
    }
  }

  getExecutionStack(req: SignalRequest): ExecutionResult {
    // Global middleware should ALWAYS run
    const executionStack: Function[] = [...this.globalMiddlewares];

    const result = this.routing.getPathMiddlewareAndHandlers(req);

    if (result.type === "FOUND") {
      executionStack.push(...result.stack);
      return {
        stack: executionStack,
        type: "FOUND",
        params: result.params,
      };
    }

    // Route not found OR method not allowed
    return {
      stack: executionStack,
      type: result.type,
      allow: result.allow,
    };
  }

  async executeStack(stack: Function[], c: Context, index = 0) {
    if (c.res.sent) return;

    const fn = stack[index];
    if (!fn) return;

    let called = false;

    if (fn.length >= 2) {
      await fn(c, async () => {
        if (called) {
          throw new Error("next() called multiple times");
        }
        called = true;
        await this.executeStack(stack, c, index + 1);
      });
    } else {
      await fn(c);
    }
  }

  logRequests() {
    this.isLogRequests = !this.isLogRequests;
  }

  validate<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: () => Promise<void>) => {
      let rawBody: unknown;

      // 1️⃣ Read JSON body (cached by SignalRequest)
      try {
        rawBody = await c.req.json();
      } catch (err) {
        if (!c.res.sent) {
          c.res.error(err, 400, "Invalid JSON body");
        }
        return;
      }

      // 2️⃣ Validate + sanitize using Zod
      const result = schema.safeParse(rawBody);

      if (!result.success) {
        if (!c.res.sent) {
          c.res.status(400).json({
            error: "Validation failed",
            issues: result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          });
        }
        return;
      }

      // 3️⃣ Attach sanitized data for handlers
      c.req.body = result.data;

      // 4️⃣ Continue middleware pipeline
      await next();
    };
  }

cors(options: CorsOptions = {}) {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH"],
    headers = ["Content-Type", "Authorization"],
    credentials = false,
    maxAge = 86400,
  } = options;

  this.use(async (c: Context, next: () => Promise<void>) => {
    const requestOrigin = c.req.header("Origin");
    let allowOrigin: string | null = null;

    // Decide allowed origin
    if (typeof origin === "string") {
      // Allow wildcard or exact match
      if (origin === "*" || origin === requestOrigin) {
        allowOrigin = origin === "*" ? "*" : requestOrigin;
      }
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        allowOrigin = requestOrigin;
      }
    } else if (typeof origin === "function") {
      if (origin(requestOrigin!)) {
        allowOrigin = requestOrigin ?? null;
      }
    }

    // If origin allowed, set headers
    if (allowOrigin) {
      c.res.header("Access-Control-Allow-Origin", allowOrigin);
      c.res.header("Vary", "Origin");
    }

    if (credentials) {
      c.res.header("Access-Control-Allow-Credentials", "true");
    }

    // Preflight handling
    if (c.req.method === "OPTIONS") {
      if (allowOrigin) {
        c.res
          .header("Access-Control-Allow-Methods", methods.join(","))
          .header("Access-Control-Allow-Headers", headers.join(","));
      }

      if (maxAge !== undefined) {
        c.res.header("Access-Control-Max-Age", String(maxAge));
      }

      c.res.status(204).text("");
      return;
    }

    await next();
  });
}

}

export default Signal;
