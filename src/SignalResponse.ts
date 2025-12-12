import {Buffer} from "buffer"



const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  500: "Internal Server Error",
};



class SignalResponse {

    private socket
    private statusCode : number
    private headers: Record<string, string> = {}
    
    constructor(socket){
        this.socket = socket;
        this.statusCode = 200;
        this.headers["Content-Type"] = "text/plain";
    }



    status(code: number) {
        this.statusCode = code;
        return this;
    }


    send(data: string | Buffer){

          if( typeof data  === "string"){
           data  = Buffer.from(data);
          }

        this.statusCode  = this.statusCode || 200
        this.headers["Content-Length"] = String(data.length);
        this.headers["Connection"] = "close";

        let header = `HTTP/1.1 ${this.statusCode} ${STATUS_TEXT[this.statusCode] || "OK"}\r\n`;

        for(const [key, val] of Object.entries(this.headers)){
            header += `${key}: ${val}\r\n`;
        }
        header += `\r\n`;


        this.socket.write(header);
        this.socket.write(data);
        this.socket.end();
    }


    text(content: string){
        this.headers["Content-Type"] = "text/plain";
        this.send(content);
    }


    json(content: any){
        this.headers["Content-Type"] = "application/json";
        this.send( JSON.stringify(content) );
    }



}



export default SignalResponse;