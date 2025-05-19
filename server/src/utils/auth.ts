import { UserJWTData } from "../Types"
import jwt from "jsonwebtoken"
import { config } from "dotenv"
import { pool } from "../db/db"

config()

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateJWT = ({id, name, email, profile_img}: UserJWTData):string => {
    const payload = {id, name, email, profile_img};
    return jwt.sign(payload, JWT_SECRET)
}

export const isValidJWT = (token:string):boolean => {
    try {
        jwt.verify(token, JWT_SECRET);
        return true;
    } catch (err) {
        return false;
    }
}

export const decryptJWT = (token: string): UserJWTData | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserJWTData;
        return decoded;
    } catch (err) {
        return null;
    }
};

