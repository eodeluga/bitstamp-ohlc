import get from "axios";
import { addMinutes, differenceInMinutes } from "date-fns";
import * as fs from "fs/promises";
import { Bucket } from "./Bucket";

const file = "./data/btcusd_ohlc.csv";

const url = (s: number, e: number): string =>
    `https://www.bitstamp.net/api/v2/ohlc/btcusd/?limit=1000&step=60&start=${s.toString()}&end=${e.toString()}`;

const makeReq = async (url: string) => {
    return await get(url).then((req) => req.data);
};

const writeString = async (data: string) => {
    await fs.appendFile(file, data);
};

const getOHLC = async () => {
    let start: number = new Date("2013-01-01T00:00:00.000Z").valueOf();
    const now: number = new Date().valueOf();
    const diffInMinutes: number = differenceInMinutes(now, start);
    const numOfReqs: number = Math.ceil(diffInMinutes / 1000);
    let end: number = addMinutes(start, 1000).valueOf();

    // Check if file exists
    await fs.access(file)
        // Delete it
        .then(() => fs.rm(file))
        .catch(() => {});
        
    // Check if data folder exists
    await fs.access("./data")
        .catch(() => {
            // Create it
            fs.mkdir("./data");
        });

    const csvHeader: string = `close,high,low,open,timestamp,volume\n`;
    await writeString(csvHeader);

    let bucketCsv: string[] = [];

    for (let i: number = 0; i < numOfReqs; i++) {
        let reqUrl: string = url(start / 1000, end / 1000);

        let json = await makeReq(reqUrl);
        await json.data.ohlc.forEach((data) => {
            let bucket = new Bucket(data);
            bucketCsv.push(
                `${bucket.close},${bucket.high},${bucket.low},${bucket.open},${bucket.timestamp},${bucket.volume}`
            );
        });

        await writeString(bucketCsv.join("\n") + "\n");

        // Set to fetch next page
        start = end;
        end = addMinutes(start, 1000).valueOf();
        bucketCsv = [];
    }
};

getOHLC();