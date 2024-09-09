import axios from "axios";
import { Request, Response } from "express";
import * as cheerio from "cheerio";

// Define TimetableRow type
interface TimetableRow {
  Date: string;
  Day: string;
  DayOrder: string;
  Event: string;
}

// Function to decode encoded strings
function decodeEncodedString(encodedString: string): string {
  return encodedString.replace(
    /\\x([0-9A-Fa-f]{2})/g,
    (match: string, p1: string) => String.fromCharCode(parseInt(p1, 16))
  );
}

// Function to get calendar data
export async function Calender(req: Request, res: Response) {
  try {
    const cookies = (req as any).session?.cookies || "";

    const timetableResponse = await axios.get(
      "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/Academic_Planner_2024_25_ODD",
      {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie: cookies,
          Host: "academia.srmist.edu.in",
          Origin: "https://academia.srmist.edu.in",
          Referer: "https://academia.srmist.edu.in/",
        }
      }
    );

    if (timetableResponse.status === 200 && timetableResponse.data) {
      const decodedHTML = decodeEncodedString(timetableResponse.data);

      // Debug only first 500 and last 500 characters of decoded HTML
      const maxLength = 500;
      const first500 = decodedHTML.slice(0, maxLength);
      const last500 = decodedHTML.slice(-maxLength);
      console.log("Decoded HTML (First 500 characters): ", first500);
      console.log("Decoded HTML (Last 500 characters): ", last500);

      const $ = cheerio.load(decodedHTML);

      const tables = $("table");

      if (tables.length > 0) {
        let response: { [month: string]: TimetableRow[] } = {};

        tables.each((tableIndex, table) => {
          $(table)
            .find("tr")
            .each((rowIndex, row) => {
              const cells = $(row).find("td");

              // Only process rows with enough columns
              if (cells.length >= 34) {
                // Extract data for each month, adjust index as per your HTML structure
                const monthData = [
                  { month: "June", index: [0, 1, 2, 3] },
                  { month: "July", index: [5, 6, 7, 8] },
                  { month: "August", index: [10, 11, 12, 13] },
                  { month: "September", index: [15, 16, 17, 18] },
                  { month: "October", index: [20, 21, 22, 23] },
                  { month: "November", index: [25, 26, 27, 28] },
                  { month: "December", index: [30, 31, 32, 33] }
                ];

                monthData.forEach(({ month, index }) => {
                  if (cells.length > index[3]) {
                    const date = $(cells[index[0]]).text().trim();
                    const day = $(cells[index[1]]).text().trim();
                    const event = $(cells[index[2]]).text().trim(); // Event should be the third column
                    const dayOrder = $(cells[index[3]]).text().trim(); // DayOrder should be the fourth column

                    const timetableEntry: TimetableRow = {
                      Date: date || "",
                      Day: day || "",
                      DayOrder: dayOrder || "",
                      Event: event || ""
                    };

                    // Initialize the month array if not already present
                    if (!response[month]) {
                      response[month] = [];
                    }

                    // Add the timetable entry to the respective month
                    response[month].push(timetableEntry);
                  }
                });
              }
            });
        });

        res.status(200).json(response);
      } else {
        console.log("No tables found in the HTML");
        res.status(404).json({ error: "Timetable data not found" });
      }
    } else {
      res
        .status(timetableResponse.status)
        .json({ error: "HTML content not found or request failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error fetching timetable data" });
  }
}
