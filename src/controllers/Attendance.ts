import axios from "axios";
import { Request, Response } from "express";
import * as cheerio from "cheerio";
import NodeCache from "node-cache";

interface ResponseData {
  user: Array<{ [key: string]: string }>;
  attendance: any[];
  marks: any[];
}

const cache = new NodeCache({ stdTTL: 120 });

function decodeEncodedString(encodedString: string): string {
  return encodedString.replace(/\\x([0-9A-Fa-f]{2})/g, (match, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
}

function extractTextBetweenWords(
  text: string,
  startWord: string,
  endWord: string
) {
  const startIndex = text.indexOf(startWord);
  const endIndex = text.indexOf(endWord);
  return startIndex !== -1 && endIndex !== -1 && startIndex < endIndex
    ? text.substring(startIndex + startWord.length, endIndex).trim()
    : null;
}

function parseTestPerformance(performance: string): {
  [key: string]: number[];
} {
  const tests: { [key: string]: number[] } = {};
  const performancePattern = /([A-Za-z0-9-]+)\/(\d+\.\d{2})(\d+\.\d+)/g;
  let match;
  while ((match = performancePattern.exec(performance)) !== null) {
    const testName = match[1];
    tests[testName] = [parseFloat(match[2]), parseFloat(match[3])];
  }
  return tests;
}

export async function Attendance(req: Request, res: Response) {
  try {
    const cookies = (req as any).session?.cookies || "";
    const key = (req as any).header?.user || "";
    console.log(key);
    // Check if data exists in the cache
    const cachedData = cache.get<ResponseData>(key);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

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

      if (!result) return res.status(404).json({ error: "Element not found" });

      const $ = cheerio.load(result);
      const response: ResponseData = { user: [], attendance: [], marks: [] };

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

      const attendanceHeadings = [
        "Course Code",
        "Course Title",
        "Category",
        "Faculty Name",
        "Slot",
        "Hours Conducted",
        "Hours Absent",
        "Attn %",
        "University Practical Details",
      ];

      $("div.cntdDiv > div > table:nth-child(4) > tbody > tr")
        .slice(1)
        .each((i, row) => {
          const details = $(row)
            .find("td")
            .map((_, td) => $(td).text().trim())
            .get();

          if (details.length > 1) {
            const courseData: { [key: string]: string } = {};
            attendanceHeadings.forEach((heading, index) => {
              courseData[heading] = details[index];
            });
            response.attendance.push(courseData);
          }
        });

      const marksHeadings = ["Course Code", "Course Type", "Test Performance"];
      $("div.cntdDiv > div > table:nth-child(7) > tbody > tr")
        .slice(1)
        .each((i, row) => {
          const details = $(row)
            .find("td")
            .map((_, td) => $(td).text().trim())
            .get();

          if (details.length > 1) {
            const marksData: { [key: string]: any } = {};
            marksHeadings.forEach((heading, index) => {
              marksData[heading] =
                heading === "Test Performance"
                  ? parseTestPerformance(details[index])
                  : details[index];
            });
            response.marks.push(marksData);
          }
        });

      cache.set(key, response);
      res.status(200).json(response);
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
