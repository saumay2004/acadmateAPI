import axios from "axios";
import { Request, Response } from "express";
import * as cheerio from "cheerio";

interface ResponseData {
  user: Array<{ [key: string]: string }>;
  attendance: any[];
  marks: any[];
}

function decodeEncodedString(encodedString: string): string {
  return encodedString.replace(
    /\\x([0-9A-Fa-f]{2})/g,
    (match: string, p1: string) => String.fromCharCode(parseInt(p1, 16))
  );
}

function extractTextBetweenWords(
  text: string,
  startWord: string,
  endWord: string
) {
  const startIndex = text.indexOf(startWord);
  const endIndex = text.indexOf(endWord);

  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    return text.substring(startIndex + startWord.length, endIndex).trim();
  } else {
    return null;
  }
}

export async function Attendance(req: Request, res: Response) {
  try {
    const cookies = (req as any).session?.cookies || "";
    // console.log(cookies);
    const attendanceResponse = await axios.get(
      `https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance`,
      {
        headers: {
          Accept: "*/*",
          Cookie: cookies,
          Host: "academia.srmist.edu.in",
          Origin: "https://academia.srmist.edu.in",
          Referer: "https://academia.srmist.edu.in/",
        },
      }
    );
    if (attendanceResponse.status === 200 && attendanceResponse.data) {
      const decodedHTML = decodeEncodedString(attendanceResponse.data);
      const result = extractTextBetweenWords(
        decodedHTML,
        "</style>\n",
        "');function doaction(recType) { }</script>"
      );
      if (result) {
        const $ = cheerio.load(result);
        let response: ResponseData = { user: [], attendance: [], marks: [] };

        // user data
        $("div.cntdDiv > div > table:nth-child(2) > tbody > tr").each(
          (i, row) => {
            const details = $(row)
              .find("td")
              .map((_, td) => $(td).text().trim())
              .get();

            if (details.length > 1) {
              const [detail, value] = details;
              response.user.push({ [detail]: value });
            }
          }
        );

        $("div.cntdDiv > div > table:nth-child(4) > tbody > tr").each(
          (i, row) => {
            const details = $(row)
              .find("td")
              .map((_, td) => $(td).text().trim())
              .get();

            if (details.length > 1) {
              response.attendance.push(details);
            }
          }
        );

        // marks data
        $("div.cntdDiv > div > table:nth-child(7) > tbody > tr").each(
          (i, row) => {
            const details = $(row)
              .find("td")
              .map((_, td) => $(td).text().trim())
              .get();

            if (details.length > 1) {
              response.marks.push(details);
            }
          }
        );

        res.status(200).json(response);
      } else {
        res.status(404).json({ error: "Element not found" });
      }
    } else {
      res
        .status(attendanceResponse.status)
        .json({ error: "HTML content not found or request failed" });
    }
  } catch (err: any) {
    console.error("Error fetching attendance data:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
