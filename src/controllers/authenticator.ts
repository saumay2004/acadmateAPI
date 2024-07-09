import axios from "axios";
import { Request, Response } from "express";

interface AuthProps {
  username: string;
  password: string;
}

export async function auth(req: Request, res: Response) {
  try {
    const payload = req.body as AuthProps | null;
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
          Cookie:
            "74c3a1eecc=86320f99d3a5ec2b36381b7353a57d1a; zccpn=685736da-54a9-46dd-9bae-e138f51d331b; ZCNEWUIPUBLICPORTAL=true; cli_rgn=IN; f0e8db9d3d=983d6a65b2f29022f18db52385bfc639; iamcsr=ffce2ff9-0fa3-4583-92a5-651c5724f33b; _zcsr_tmp=ffce2ff9-0fa3-4583-92a5-651c5724f33b; JSESSIONID=EFE3E9A80B14A039EFA5EA5070FD8F3F",
          Host: "academia.srmist.edu.in",
          Origin: "https://academia.srmist.edu.in",
          Referer:
            "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
          "X-Zcsrf-Token": "iamcsrcoo=ffce2ff9-0fa3-4583-92a5-651c5724f33b",
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
          Cookie:
            "74c3a1eecc=86320f99d3a5ec2b36381b7353a57d1a; zccpn=685736da-54a9-46dd-9bae-e138f51d331b; ZCNEWUIPUBLICPORTAL=true; cli_rgn=IN; f0e8db9d3d=983d6a65b2f29022f18db52385bfc639; iamcsr=ffce2ff9-0fa3-4583-92a5-651c5724f33b; _zcsr_tmp=ffce2ff9-0fa3-4583-92a5-651c5724f33b; JSESSIONID=EFE3E9A80B14A039EFA5EA5070FD8F3F",
          Host: "academia.srmist.edu.in",
          Origin: "https://academia.srmist.edu.in",
          Referer:
            "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
          "X-Zcsrf-Token": "iamcsrcoo=ffce2ff9-0fa3-4583-92a5-651c5724f33b",
        },
      });

      const passwordData = passwordResponse.data;
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
