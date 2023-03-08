import get from "axios";
import { addMinutes, differenceInMinutes } from "date-fns";
import * as fs from "fs/promises";
import CSVBucket from "./Bucket";
import * as readLastLines from "read-last-lines";

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
    let resumeTS: number;
    const now: number = new Date().valueOf();
    const diffInMinutes: number = differenceInMinutes(now, start);
    const numOfReqs: number = Math.ceil(diffInMinutes / 1000);
    let end: number = addMinutes(start, 1000).valueOf();

    // Get last line if file exists
    const lastLine = await fs.access(file)
        .then(() => (readLastLines.read(file, 1)))
        .catch(() => {});
        
    if (lastLine) {
        // Get last timestamp plus 1 min
        const lastBucket = new CSVBucket(lastLine)
        resumeTS = lastBucket.nextTimeStamp();
    } else {
        // No lastline so file doesn't exist
        // Check if data folder exists
        await fs.access("./data")
        .catch(() => {
            // Create it
            fs.mkdir("./data");
        });    
    }
    
    if (!resumeTS) {
        // No resume time so new CSV file with header required
        const csvHeader: string = `close,high,low,open,timestamp,volume\n`;
        await writeString(csvHeader);    
    } else {
        // Set start to last timestamp plus one minute
        start = resumeTS;
        end = addMinutes(start, 1000).valueOf();
    }
    
    let bucketCsv: string[] = [];

    for (let i: number = 0; i < numOfReqs; i++) {
        let reqUrl: string = url(start / 1000, end / 1000);

        let json = await makeReq(reqUrl);
        await json.data.ohlc.forEach((data) => {
            let bucket = new CSVBucket(data);
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