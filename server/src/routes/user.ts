import { Router } from "express";
import { decryptJWT, isValidJWT } from "../utils/auth";

const router = Router();

router.get("/profile", (req, res) => {
    try {
        const cookies = req.headers.cookie;
        if(!cookies){
            res.status(302).json({message: " unauthorized"})
            return;
        }
        const token = cookies.split("; ").find((cookie) => cookie.startsWith("token="))?.split("=")[1];
        if(!token) {
            res.status(302).json({message: " unauthorized"})
            return;
        }
        const data = decryptJWT(token)
        if(!data) {
            res.status(302).json({message: " unauthorized"})
            return;
        }
        res.status(200).json({user: data})
    } catch (error) {
        res.status(500).json({mesage: " something went wrong..."})
    }
})

export default router;