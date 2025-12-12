import type SignalRequest from "../src/SignalRequest";






export function getUser(req : SignalRequest, res: any){

    console.log("Get User Called", (req as any).user);

    return res.status(200).json({
        user: "dipan"
    })
}