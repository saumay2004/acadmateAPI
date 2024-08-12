import axios from "axios";
import { Request, Response } from "express";

interface AuthProps {
  username: string;
  password: string;
}

export async function auth(req: Request, res: Response) {
  try {
    const payload = req.body as AuthProps | null;

    // Getting and storing cookies from the first request
    const cookieGetResponseOne = await axios.get(
      "https://academia.srmist.edu.in/",
      {
        headers: {
          connection: "keep-alive",
          Referer: "https://academia.srmist.edu.in/",
        },
      }
    );

    // Getting and storing cookies from the second request
    const cookieGetResponseTwo = await axios.get(
      "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
      {
        headers: {
          connection: "keep-alive",
          Referer: "https://academia.srmist.edu.in/",
        },
      }
    );

    const setCookieHeaderOne = cookieGetResponseOne.headers["set-cookie"];
    const setCookieHeaderTwo = cookieGetResponseTwo.headers["set-cookie"];

    // Combine cookies from both responses into one array
    let allCookies: string[] = [];
    if (setCookieHeaderOne) {
      allCookies = allCookies.concat(setCookieHeaderOne);
    }
    if (setCookieHeaderTwo) {
      allCookies = allCookies.concat(setCookieHeaderTwo);
    }

    // Function to split and trim cookie strings
    function splitCookieString(cookieString: string): string[] {
      return cookieString
        .split(";")
        .map((cookie: string) => cookie.trim())
        .filter((cookie: string) => cookie.length > 0);
    }
    console.log(allCookies);
    if (allCookies.length > 0) {
      // Convert the array of cookies into a single string before splitting
      const combinedCookieString = allCookies.join("; ");
      (req as any).session.cookies = splitCookieString(combinedCookieString);
    }

    let cookies = (req as any).session.cookies;

    if (!payload) {
      throw new Error("Invalid payload");
    }

    const { username, password } = payload;
    const cli_time = Date.now();
    const serviceurl = encodeURIComponent(
      "https://academia.srmist.edu.in/portal/academia-academic-services/redirectFromLogin"
    );
    const requestBody = `mode=primary&cli_time=${cli_time}&servicename=ZohoCreator&service_language=en&serviceurl=${serviceurl}`;

    const lookupResponse = await axios.post(
      `https://academia.srmist.edu.in/accounts/p/10002227248/signin/v2/lookup/${username}`,
      requestBody,
      {
        headers: {
          Accept: "*/*",
          "Content-Length": Buffer.byteLength(requestBody).toString(),
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Cookie: cookies,
          Host: "academia.srmist.edu.in",
          Origin: "https://academia.srmist.edu.in",
          Referer:
            "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
          "X-Zcsrf-Token": `iamcsrcoo=${cookies[28].slice(7)}`,
        },
      }
    );

    const data = lookupResponse.data;
    const userNameCorrect = data.message;

    if (userNameCorrect === "User exists") {
      const { identifier, digest } = data.lookup;
      const passwordUrl = `https://academia.srmist.edu.in/accounts/p/10002227248/signin/v2/primary/${identifier}/password?digest=${digest}&cli_time=${cli_time}&servicename=ZohoCreator&service_language=en&serviceurl=${serviceurl}`;
      const passwordBody = {
        passwordauth: {
          password: password,
        },
      };

      const passwordResponse = await axios.post(passwordUrl, passwordBody, {
        headers: {
          Accept: "*/*",
          "Content-Length": Buffer.byteLength(
            JSON.stringify(passwordBody)
          ).toString(),
          "Content-Type": "application/json;charset=UTF-8",
          Cookie: cookies,
          Host: "academia.srmist.edu.in",
          Origin: "https://academia.srmist.edu.in",
          Referer:
            "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
          "X-Zcsrf-Token": `iamcsrcoo=${cookies[28].slice(7)}`,
        },
      });
      const setCookieHeaderThree = passwordResponse.headers["set-cookie"];
      if (setCookieHeaderThree) {
        allCookies = allCookies.concat(setCookieHeaderThree);
        const combinedCookieString = allCookies.join("; ");
        (req as any).session.cookies = splitCookieString(combinedCookieString);
      }
      const passwordData = passwordResponse.data;
      console.log((req as any).session.cookies);
      if (passwordData.message === "Sign in success") {
        console.log("success");
        res.status(200).json({ message: "Sign in success" });
      } else {
        console.log(passwordData.message);
        res.status(401).json({ message: passwordData.message });
      }
    } else {
      console.log(userNameCorrect);
      res.status(404).json({ message: userNameCorrect });
    }
  } catch (err: any) {
    console.error(err, err.message);
    res.status(500).json({ error: err.message });
  }
}
