import Signal from "../src";



const app = new Signal();



app.createServer((req, res) => {
    res.status(200).json({
        message : "Hello World"
    })
})



app.listen(8000, () => {
    console.log("Listening on port 8000");
})