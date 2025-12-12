import { getUser } from "./authController";
import app from "./signal";


const router = app.router();


router.get("/users", getUser);


export default router