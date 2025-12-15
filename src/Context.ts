// Context.ts
import SignalRequest from "./SignalRequest";
import SignalResponse from "./SignalResponse";

class Context {
  req: SignalRequest;
  res: SignalResponse;

  constructor(req: Request) {
    this.req = new SignalRequest(req);
    this.res = new SignalResponse();
  }
}

export default Context;
