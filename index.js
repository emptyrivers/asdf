import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import Puppeteer, {Browser} from "puppeteer";
// adaptation of https://github.com/alvarcarto/url-to-pdf-api/blob/d92182007c3fe707307055dce5b15d41a0e1b00b/src/core/render-core.js
// (read: stripped down to bare minimum and tailored to our needs)

/** @type {Handler<APIGatewayProxyEvent, APIGatewayProxyResult>} */
export const handler = async (event) => {
  /** @type {Browser} */
  let browser;
  try {
    browser = await Puppeteer.launch({
      args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
    });
    /** @type {{url: string}} */
    const body = JSON.parse(event.body);

    const page = await browser.newPage();
    page.on('console', (e, ...args) => console.log(e, ...args));
    await page.goto(body.url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitFor("[data-renderStatus='complete']", {
      timeout: 60000,
    });
    const pdf = await page.pdf();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': "application/pdf"
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Error occurred when generating PDF"
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

