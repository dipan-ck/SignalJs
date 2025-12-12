import app from "./signal";
import SignalRequest from "../src/SignalRequest";
import SignalResponse from "../src/SignalResponse";
import router from "./authroute"



// Register middleware once
app.use("/", (req: SignalRequest, res: SignalResponse, next: () => void) => {
    console.log("Middleware 1");
    (req as any).message = "hello"
    next();
});


app.use(async (req: SignalRequest, res: SignalResponse, next: () => void) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    (req as any).user = "dipan"
    next();
})



app.use("/special", (req: SignalRequest, res: SignalResponse, next: () => void) => {
    console.log("Special Middleware");
    next();
})




app.use("/api/auth", router);



app.listen(8000, () => {
    console.log("Listening on port 8000");
})