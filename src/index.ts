import * as net from "net";
import HttpParser from "./parser";
import SignalRequest from "./SignalRequest";
import SignalResponse from "./SignalResponse";

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


class Signal {
  private server: net.Server;

  constructor() {
    this.server = net.createServer();
  }

  createServer = (callback: (signalRequest: SignalRequest, signalResponse: SignalResponse) => void) => {
    this.server = net.createServer((socket) => {
      socket.on("data", (data) => {

        const req : string = data.toString();

       const signalRequest = httpParser.parseHeader(req)
       const signalResponse = new SignalResponse(socket);

        callback(signalRequest, signalResponse);
      });
    });
  };

  listen = (port: number, cb: () => void) => {
    this.server.listen(port, cb);
  };
}

export default Signal;
