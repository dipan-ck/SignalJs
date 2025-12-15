import z from "zod";
import type Context from "./Context";
import Signal from "./Signal";
import { ZodSchema, ZodError } from "zod/v3";

const app = new Signal();

const router = app.router();

 app.logRequests();

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.res
      .status(400)
      .json({
        error: "Validation failed",
        issues: err.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
  }

  console.error(err);
  return c.res
    .status(500)
    .json({ error: "Internal Server Error" });
});





 const userSchema = z.object({
    name: z.string(),
    age: z.number().min(7, "Age must be at least 6"),
 });


router.POST("/hello", app.validate(userSchema), async (c: Context) => {
    console.log(c.req.body);
    
    c.res.text("Hello, World!");
});




// router.GET("/api/test", async (c: Context) => {
    
//     c.res.json({ message: "API Test Route" });
// });



// router.GET("/api/test/:id/name/:class", (c)=>{
//     const id = c.req.params.id;
//     console.log(c.req.params);
    
//     c.res.json({ message: `You requested ID: ${id}` });
// })


// router.POST("/api/test/v2", async(c, next)=>{ 
//     console.log("for route level middleware");
//     await next();
//  }, async(c)=> {
//     const data = await c.req.json();
//     console.log(data);
    
//     c.res.json({ received: data });
// })



// app.use("/api", async (c, next) => {
//     console.log("API Middleware");
//     await next();
// });




Bun.serve({
    port: 8000,
    fetch: app.handle.bind(app),
});




// app.listen(8000, () => {
//     console.log("Server is listening on port 8000");
// } )