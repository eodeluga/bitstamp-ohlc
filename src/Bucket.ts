import { addMinutes } from "date-fns";

type Bucket = {
    close: number | undefined;
    high: number | undefined;
    low: number | undefined;
    open: number | undefined;
    timestamp: number | undefined;
    volume?: number | undefined;
}

function fromCSVLine(csvLine: string): Bucket {
    const [ close, high, low, open, timestamp, volume ] = csvLine.split(",");
    const csvBucket: Bucket = {
        close: +parseFloat(close).toFixed(2), 
        high: +parseFloat(high).toFixed(2), 
        low: +parseFloat(low).toFixed(2), 
        open: +parseFloat(open).toFixed(2), 
        timestamp: parseInt(timestamp),
        volume: parseFloat(volume),
    };
    return csvBucket;
}

export default class CSVBucket {   
    
    close: number | undefined;
    high: number | undefined;
    low: number | undefined;
    open: number | undefined;
    timestamp: number | undefined;
    volume: number | undefined;
    
    
    constructor(csvLine?: string) {
        
        if (csvLine) {
            const { close, high, low, open, timestamp, volume } =  fromCSVLine(csvLine);
            this.close = close;
            this.high = high;
            this.low = low;
            this.open = open;
            this.timestamp = timestamp;
            this.volume = volume;            
        }
    }
    
    nextTimeStamp(): number | undefined {
        if (this.timestamp) {
            const nextTS = addMinutes(new Date(this.timestamp), 1);
            return new Date(nextTS).valueOf();   
        }
    }
}












