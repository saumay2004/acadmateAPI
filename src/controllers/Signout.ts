import { Request, Response } from "express";
declare module "express-session" {
  interface SessionData {
    [key: string]: any;
  }
}

export async function SignOut(req: Request, res: Response) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Error in destroying session");
      }
      res.clearCookie("connect.sid");
      return res.send("Session destroyed");
    });
  } else {
    return res.status(400).send("No active session to destroy");
  }
}
