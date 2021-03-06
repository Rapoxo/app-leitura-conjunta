import type Review from "../../../models/Review";
import type { NextApiRequest, NextApiResponse } from "next";
import * as cheerio from "cheerio";
import axios from "axios";

type ErrorMessage = {
  error: boolean;
  message: string | unknown;
};

const isNew = (date: string): boolean => {
  const dateArray = date.split("/");
  const dateObject = new Date(Number(dateArray[2]), Number(dateArray[1]) - 1, Number(dateArray[0]));
  const currentDate = new Date();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const diff = currentDate.getTime() - dateObject.getTime();
  return diff < oneWeek;
};

const fetchPages = async (userID: string) => {
  const page = await axios.get(`https://www.skoob.com.br/estante/resenhas/${userID}`, { responseEncoding: "binary" });
  const $ = cheerio.load(page.data.toString("ISO-8859-1"));
  const pageCount = Math.ceil(parseInt($(".contador").children().first().text().split(" ")[0]) / 5);
  if (!pageCount) return [page.data];
  let pages = new Array(pageCount).fill(null);
  return await Promise.all(
    pages.map(async (page, index) => {
      let response = await axios.get(`https://www.skoob.com.br/estante/resenhas/${userID}/mpage:${index + 1}`, { responseEncoding: "binary" });
      return response.data;
    })
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Review[] | ErrorMessage>) {
  if (req.method !== "GET") return res.status(405).json({ error: true, message: "Method not allowed" });
  const userID = <string>req.query.id;
  if (!userID) return res.status(403).json({ error: true, message: "User ID not provided" });
  try {
    const reviews: Review[] = [];
    const pages = await fetchPages(userID);
    pages.forEach(page => {
      const $ = cheerio.load(page, { decodeEntities: false });
      $("div.curva2-5").each((i, el) => {
        const element = $(el);
        if (element.children().length === 1) {
          const author = element
            .first()
            .find("strong")
            .text()
            .split(/(?=[A-Z])/)[0];
          let title: string[] | string = element.first().find("strong").text();
          const date = element.first().find("span").text().trim();
          const reviewContent = element.first().contents().text();
          const review: Review = {
            author_id: parseInt(userID),
            book_id: parseInt(<string>$(element).parent().find("star-rating").attr("id")),
            author: author.trim(),
            title: title ? title : null,
            date,
            review: title ? reviewContent.split(date)[1].trim().split(title)[1].toString() : reviewContent.split(date)[1].trim() + "",
            rating: parseInt(<string>$(element).parent().find("star-rating").attr("rate")),
            isNew: isNew(date),
            profilePicture: $(page).find(".round-4").find("img").attr("src") ?? null,
          };
          reviews.push(review);
        }
      });
    });
    return res.status(200).json(reviews);
  } catch (err) {
    console.log(err);
  }
}
