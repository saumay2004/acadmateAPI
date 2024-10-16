import axios from "axios";
import { Request, Response } from "express";
import * as cheerio from "cheerio";
import { Cheerio } from "cheerio";

interface ResponseData {
  user: Array<{ [key: string]: string }>;
  timetable: any[];
  advisors: Array<{ role: string; name: string; email: string; phone: string }>;
}

const expectedHeaders = [
  "Course Code",
  "Course Title",
  "Credit",
  "Regn. Type",
  "Category",
  "Course Type",
  "Faculty Name",
  "Slot",
  "GCR Code",
  "Room No.",
  "Academic Year",
];

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

export async function TimeTable(req: Request, res: Response) {
  try {
    const cookies = (req as any).session?.cookies || "";

    const timetableResponse = await axios.get(
      `https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24`,
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

    if (timetableResponse.status === 200 && timetableResponse.data) {
      const decodedHTML = decodeEncodedString(timetableResponse.data);
      const result = extractTextBetweenWords(
        decodedHTML,
        "</style>\n",
        "');function doaction(recType) { }</script>"
      );
      if (result) {
        const $ = cheerio.load(result);
        let response: ResponseData = { user: [], timetable: [], advisors: [] };

        // Extracting user data
        $("div.cntdDiv > div > table:nth-child(1) > tbody > tr").each(
          (i, row) => {
            const details = $(row)
              .find("td")
              .map((_, td) => $(td).text().trim())
              .get();

            if (details.length > 1) {
              const [label1, value1, label2, value2] = details;
              response.user.push({ [label1.replace(":", "")]: value1 });
              if (label2) {
                response.user.push({ [label2.replace(":", "")]: value2 });
              }
            }
          }
        );

        // Find all tables in the document
        const tables = $("table");

        // Iterate over each table to find the one that matches the expected headers
        let timetableTable: Cheerio<cheerio.Element> | undefined;
        tables.each((index, table) => {
          const headers = $(table)
            .find("tr")
            .first()
            .find("td, th")
            .map((i, el) => $(el).text().trim())
            .get();

          // Check if the headers match the expected headers
          const isMatch = expectedHeaders.every((header) =>
            headers.includes(header)
          );

          if (isMatch) {
            timetableTable = $(table);
            return false; // Break the loop once the correct table is found
          }
        });

        // If the timetable table is found, extract the data
        const timetableData: Array<{
          SNo: string;
          CourseCode: string;
          CourseTitle: string;
          Credit: string;
          RegnType: string;
          Category: string;
          CourseType: string;
          FacultyName: string;
          Slot: string;
          GCRCode: string;
          RoomNo: string;
          AcademicYear: string;
        }> = [];
        if (timetableTable) {
          timetableTable.find("tr").each((index, element) => {
            const row = $(element)
              .find("td")
              .map((i, el) => $(el).text().trim())
              .get();
            if (row.length) {
              timetableData.push({
                SNo: row[0] || "",
                CourseCode: row[1] || "",
                CourseTitle: row[2] || "",
                Credit: row[3] || "",
                RegnType: row[4] || "",
                Category: row[5] || "",
                CourseType: row[6] || "",
                FacultyName: row[7] || "",
                Slot: row[8] || "",
                GCRCode: row[9] || "",
                RoomNo: row[10] || "",
                AcademicYear: row[11] || "",
              });
            }
          });

          response.timetable = timetableData;
        } else {
          console.log("Timetable not found");
        }

        // // Extracting advisors data
        // $("table[width='800px'] > tr").each((i, row) => {
        //   const role = $(row).find("strong").first().text().trim();
        //   const name = $(row).find("strong").eq(1).text().trim();
        //   const email = $(row).find('font[color="blue"]').text().trim();
        //   const phone = $(row).find('font[color="green"]').text().trim();

        //   if (role && name && email && phone) {
        //     response.advisors.push({ role, name, email, phone });
        //   }
        // });

        // Find the table containing the advisors' data
        const advisorTable = $("table[width='800px']");

        // If the advisor table is found, extract the data
        if (advisorTable.length > 0) {
          advisorTable.find("tr").each((index, row) => {
            const cells = $(row).find("td");

            cells.each((i, cell) => {
              const role = $(cell).find("strong").first().text().trim();
              const name = $(cell).find("strong").eq(1).text().trim();
              const email = $(cell).find('font[color="blue"]').text().trim();
              const phone = $(cell).find('font[color="green"]').text().trim();

              if (role && name && (email || phone)) {
                response.advisors.push({ role, name, email, phone });
              }
            });
          });
        } else {
          console.log("Advisor table not found");
        }

        res.status(200).json(response);
      } else {
        res.status(404).json({ error: "Element not found" });
      }
    } else {
      res
        .status(timetableResponse.status)
        .json({ error: "HTML content not found or request failed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error fetching attendance data" });
  }
}
