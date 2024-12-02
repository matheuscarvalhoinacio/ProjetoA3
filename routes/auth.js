import express from "express"
import { createSession,verifySessionControll, deleteSession} from "../Controllers/auth.js"
const router = express.Router()
 router.post("/login", createSession)
router.get("/verify", verifySessionControll)
router.delete("/", deleteSession);
export default router 