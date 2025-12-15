import { exec } from "child_process";
import type SignalRequest from "./SignalRequest";
import type Context from "./Context";

export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type Middleware = (c: Context, next?: () => Promise<void>) => Promise<void>;


export type RouteEntry = {
  middlewares: Function[];
  handler: Function;
};

export type ExecutionResult = {
  stack: Function[];
  type: "FOUND" | "NOT_FOUND" | "METHOD_NOT_ALLOWED";
  allow?: HTTPMethod[];
  params?: Record<string, string>;
};

class TrieNode {
  children: Map<string, TrieNode>;
  paramChild?: TrieNode;
  paramName?: string;

  middlewares: Function[];
  routes: Map<HTTPMethod, RouteEntry>;

  constructor(path: string) {
    this.children = new Map();
    this.middlewares = [];
    this.routes = new Map();
  }
}

class Routing {
  RootRoutingNode: TrieNode;

  constructor() {
    this.RootRoutingNode = new TrieNode("/");
  }

  createRoute(path: string, root: TrieNode): TrieNode {
    // Split the path into segments ex: "/api/test" -> ["api", "test"]
    const segments = path.split("/").filter(Boolean);
    let currNode = root;

    for (const segment of segments) {
      // we will cehck if the segment is a dynamic parameter which starts with : if yes then we will add it to the paramChild of the current node
      if (segment.startsWith(":")) {
        if (!currNode.paramChild) {
          const node = new TrieNode(segment);
          node.paramName = segment.slice(1);
          currNode.paramChild = node;
        }
        currNode = currNode.paramChild;
        continue;
      }

      // if the segment is a normal static segment then we will add it to the children map of the current node
      if (!currNode.children.has(segment)) {
        currNode.children.set(segment, new TrieNode(segment));
      }
      currNode = currNode.children.get(segment)!;
    }

    return currNode;
  }

  private registerRoute(
    path: string,
    method: HTTPMethod,
    ...middlewaresAndHandler: Function[]
  ) {
    if (middlewaresAndHandler.length === 0)
      throw new Error(`Handler is required for ${method} ${path}`);

    const routeNode = this.createRoute(path, this.RootRoutingNode);
    if (!routeNode) return;
    const handler = middlewaresAndHandler[middlewaresAndHandler.length - 1]!;
    const middlewares = middlewaresAndHandler.slice(0, -1);

    if (typeof handler !== "function") {
      throw new Error(`Handler must be a function for ${path}`);
    }

    if (routeNode.routes.has(method)) {
      throw new Error(`Route already exists for ${method} ${path}`);
    }

    routeNode.routes.set(method, {
      middlewares,
      handler,
    });
  }

  GET(path: string, ...middlewaresAndHandler: Function[]) {
    this.registerRoute(path, "GET", ...middlewaresAndHandler);
  }

  POST(path: string, ...middlewaresAndHandler: Function[]) {
    this.registerRoute(path, "POST", ...middlewaresAndHandler);
  }

  PUT(path: string, ...middlewaresAndHandler: Function[]) {
    this.registerRoute(path, "PUT", ...middlewaresAndHandler);
  }

  DELETE(path: string, ...middlewaresAndHandler: Function[]) {
    this.registerRoute(path, "DELETE", ...middlewaresAndHandler);
  }

  PATCH(path: string, ...middlewaresAndHandler: Function[]) {
    this.registerRoute(path, "PATCH", ...middlewaresAndHandler);
  }

  mountRouter(basePath: string, router: Routing) {
    // Get the base node where we want to mount the router
    const baseNode = this.createRoute(basePath, this.RootRoutingNode);
    
    // Recursively merge the router's trie into the base node
    this.mergeNodes(baseNode, router.RootRoutingNode);
  }

  private mergeNodes(target: TrieNode, source: TrieNode) {
    // Merge middlewares
    target.middlewares.push(...source.middlewares);

    // Merge routes
    for (const [method, route] of source.routes.entries()) {
      if (target.routes.has(method)) {
        throw new Error(`Route conflict: ${method} already exists at this path`);
      }
      target.routes.set(method, route);
    }

    // Merge static children
    for (const [segment, childNode] of source.children.entries()) {
      if (!target.children.has(segment)) {
        target.children.set(segment, childNode);
      } else {
        // Recursively merge if child already exists
        this.mergeNodes(target.children.get(segment)!, childNode);
      }
    }

    // Merge param child
    if (source.paramChild) {
      if (!target.paramChild) {
        target.paramChild = source.paramChild;
      } else {
        // Recursively merge param children
        this.mergeNodes(target.paramChild, source.paramChild);
      }
    }
  }

  getPathMiddlewareAndHandlers(req: SignalRequest): ExecutionResult {
    const segments = req.path.split("/").filter(Boolean);
    const method = req.method.toUpperCase() as HTTPMethod;
    const params: Record<string, string> = {};

    const stack: Function[] = [];
    let currNode = this.RootRoutingNode;

    // this is the root path / so we wil add all the middlewares of root node they will be always executed first
    stack.push(...currNode.middlewares);

    for (const segment of segments) {
      if (currNode.children.has(segment)) {
        currNode = currNode.children.get(segment)!;
      } else if (currNode.paramChild) {
        params[currNode.paramChild.paramName!] = segment;
        currNode = currNode.paramChild;
      } else {
        return { stack, type: "NOT_FOUND" };
      }

      stack.push(...currNode.middlewares);
    }

    //if we reached here that means the path is found now we need to check if the method is allowed for this path
    if (currNode.routes.size > 0 && !currNode.routes.has(method)) {
      return {
        stack,
        type: "METHOD_NOT_ALLOWED",
        allow: currNode.routes.size > 0 ? [...currNode.routes.keys()] : [],
      };
    }

    //get the route for the method
    const route = currNode.routes.get(method);
    if (!route) {
      return {
        stack,
        type: "NOT_FOUND",
      };
    }

    stack.push(...route.middlewares);
    stack.push(route.handler);

return {
  type: "FOUND",
  stack,
  params
};

  }
}

export default Routing;
