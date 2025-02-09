import { ChatPromptTemplate } from "@langchain/core/prompts";
import { chromium, Page } from "playwright";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { z } from "zod";

/**
 * News Article Extractor schema, used for extracting
 * structured data from a news articles.
 * 
 * @returns The schema for a news article object
 */
export const newsArticleSchema = z.object({
    title: z.string().describe("The title of the news article"),
    url: z.string().describe("The URL of the news article"),
    body: z
        .optional(z.string())
        .describe("The body of the news article"),
    author: z
        .optional(z.string())
        .nullable()
        .describe("The author of the news article"),
    date: z
        .optional(z.string())
        .nullable()
        .describe("The date the news article was published"),
});

/**
 * Type definition for a news article object.
 */
export type NewsArticle = z.infer<typeof newsArticleSchema>;

/**
 * Chat prompt template for the news article extractor.
 */
export const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are an expert extraction algorithm.
        Only extract relevant information from the article.
        If you do not know the value of an attribute asked to extract,
        return null for the attribute's value`
    ],
    [ "human", "{text}" ]
]);

/**
 * Extracts the content of a news article from a given URL. If
 * there is no article tag in the page, it will relay the URL
 * to the Jina AI service to extract the article content 
 * through MarkDown text.
 * 
 * @param url The URL of the article to extract information from
 * @returns The extracted article content as MarkDown text
 */
export async function getContentAsMarkdown(url: string): Promise<string> {
    try {
        if (!isValidUrl(url)) {
            throw new Error(`Invalid URL: ${url}`);
        } else {
            console.log(`Valid URL: ${url}`);
        }

        const browserless_url = process.env.BROWSERLESS_WS_ENDPOINT;
        if (!browserless_url) {
            throw new Error("BROWSER_WS_ENDPOINT is not defined");
        }

        console.log(`Connecting to browserless endpoint at ${browserless_url}`);
        const browser = await chromium.connect(browserless_url, {
            timeout: 20_000,
        });
        const page = await browser.newPage();

        try {
            console.log(`Navigating to ${url}`);
            await page.goto(url, { waitUntil: "networkidle" });

            console.log("Extracting article content...");
            const articleContent = await extractArticleFromUrl(page);

            if (articleContent) {
                console.log("Article content extracted successfully.");
                return articleContent;
            } else {
                console.info("No article tag found. Using Jina AI service to extract article content...");
                const extractedContent = await extractArticleWithJina(url);

                console.log("Article content extracted successfully");
                return extractedContent;
            }
        } finally {
            await browser.close();
        }
    } catch (error) {
        console.error(`Error extracting article content: ${error}`);
        return "";
    }
}

/**
 * Checks if a given string is a valid URL.
 * 
 * @param urlString The string to check if it is a valid URL
 * @returns True if the string is a valid URL, false otherwise
 */
function isValidUrl(urlString: string): boolean {
    try {
        new URL(urlString);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extracts the article content from a given page.
 * 
 * @param page The page to extract the article content from
 * @returns The extracted article content or null if no article was found
 */
async function extractArticleFromUrl(page: Page): Promise<string | null> {
    const articleHandle = await page.$("article");
    if (!articleHandle) {
        return null;
    }

    const articleHtml = await articleHandle.innerHTML();
    return NodeHtmlMarkdown.translate(articleHtml).trim() || null;
}

/**
 * Extracts the article content from a given URL using the Jina AI service.
 * 
 * @param url The URL of the article to extract the content from
 * @returns The extracted article content
 */
async function extractArticleWithJina(url: string): Promise<string> {
    const endpoint = `https://r.jina.ai/${encodeURIComponent(url)}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`Unable to fetch from r.jina.ai with url ${url} and status: ${response.status}`);
    }

    return await response.text();
}