import { Router } from "express";
import passport from "passport"
import { Strategy as GoogleStrategy} from "passport-google-oauth20"
import {config } from "dotenv"
import { createUser, pool } from "../db/db";
import { generateJWT } from "../utils/auth";

const router = Router()
config()

passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.SERVER_URL + "/auth/google/callback",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async (accessToken: string, refreshToken: string,profile: any, cb: any ) => {
    try {
        // Query to find an existing user
        const getEmailQuery = `SELECT "id", "name", "email", "profile_img" FROM "users" WHERE "email" = $1`;
        const { rows } = await pool.query(getEmailQuery, [profile.emails[0].value]);
        
        if (rows.length > 0) {
          // User exists
          const user = rows[0];
          cb(null, user);
          return;
        }

        // Create a new user if not found
        const user = await createUser(profile.displayName, profile.emails[0].value, profile.photos?.[0]?.value || "");

        cb(null, user);
    } catch (error) {
        console.error("Error in GoogleStrategy:", error);
        cb(error, null);
    }
}))

router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"], // things that i am asking permition of a user
}))

router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/login", session: false}), (req, res)=> {
    try {
        if (!req.user) {
            return res.redirect(process.env.CLIENT_URL || "/login");
        }
        const token = generateJWT({// @ts-ignore
            id: req.user.id,// @ts-ignore
            name: req.user.name,// @ts-ignore
            profile_img: req.user.profile_img,// @ts-ignore
            email: req.user.email,
        })
        res.cookie("token", token, {
            httpOnly: false,
            secure:  true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        })
        res.redirect(process.env.CLIENT_URL + "/")

    } catch (err) {
        console.log(err)
        res.redirect(process.env.CLIENT_URL + "/")
    }
    
})


router.get("/login", async (req, res) => {
    try {
        res.send(`
            <div>
                <a href="/auth/google"><button> LOGIN WITH GOOGLE</button></a>
            </div>
        `).status(200)
    } catch (err) {
        res.status(500).json({message: "Internal server error"})
    }
})

router.get("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
    });
    res.redirect(process.env.CLIENT_URL || "/login");
  } catch (err) {
    console.error("Error in logout:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/guest-login", async (req, res) => {
    try {
        
    } catch (err) {
        res.status(500).json({messag: "something went wrong"})
    }
})

export default router;