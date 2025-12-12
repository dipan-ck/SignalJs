import * as net from "net";
import HttpParser from "./parser";
import SignalRequest from "./SignalRequest";
import SignalResponse from "./SignalResponse";
import Routes from "./Routes";

// Define types
export type HttpHeaders = Record<string, string>;

export interface ParsedRequest {
  method: string;
  path: string;
  query?: Record<string, string>; // optional query parameters
  version: string;
  headers: HttpHeaders;
  body?: string;
}




const httpParser = new HttpParser();



type MiddlewareItem = {
  path?: string;
  fn: (req: SignalRequest, res: SignalResponse, next: () => void) => void;
};



class Signal {
  private server: net.Server;
    private middlewares: MiddlewareItem[] = [];

  constructor() {
    this.server = net.createServer();
  }

  createServer = () => {
    this.server = net.createServer((socket) => {
      socket.on("data",async (data) => {

        const req : string = data.toString();

       const signalRequest = httpParser.parseHeader(req)
       const signalResponse = new SignalResponse(socket);

      await this.next(signalRequest, signalResponse, 0);

      });
    });
  };



  listen = (port: number, cb: () => void) => {

     this.createServer();
    this.server.listen(port, cb);
  };

  
async next(req: SignalRequest, res: SignalResponse, index: number = 0) : Promise<void> {
  if (index >= this.middlewares.length || res.sent) return;

  const middleware = this.middlewares[index];
  if (!middleware) return;

  const { path, fn } = middleware;
  // Match if no path specified, or if paths match exactly, or if request path starts with middleware path
  const shouldExecute = !path || req.path === path || req.path.startsWith(path + "/") || (path !== "/" && req.path === path);

  if (shouldExecute) {
    // Wrap middleware execution into a promise
    await new Promise<void>((resolve) => {
      fn(req, res, () => resolve());
    });

    return this.next(req, res, index + 1);
  }

  return this.next(req, res, index + 1);
}



router(){
  return new Routes();
}




use(
  pathOrFnOrRouter: string | ((req: SignalRequest, res: SignalResponse, next: () => void) => void) | any,
  maybeFnOrRouter?: ((req: SignalRequest, res: SignalResponse, next: () => void) => void) | any
) {



if (typeof pathOrFnOrRouter === "string" && maybeFnOrRouter instanceof Routes) {
    const prefix = pathOrFnOrRouter;

    for (const route of maybeFnOrRouter.routes) {
        // Use forward slashes for HTTP paths, not OS-specific path separators
        const fullPath = (prefix   + route.path).replace(/\/+/g, "/");
      
        

        this.middlewares.push({
            path: fullPath,
            fn: async (req, res, next) => {
                if (req.method === route.method) {
                    for (const handler of route.handlers) {
                        if (res.sent) break;
                        await handler(req, res, next);
                    }
                    // Call next() after handlers execute (if response not sent)
                    if (!res.sent) next();
                } else {
                    next();
                }
            }
        });
    }

    return;
}



    if (typeof pathOrFnOrRouter === 'function') {
      this.middlewares.push({ fn: pathOrFnOrRouter });
    } else {
      this.middlewares.push({ path: pathOrFnOrRouter, fn: maybeFnOrRouter! });
    }
  }



}

export default Signal;
