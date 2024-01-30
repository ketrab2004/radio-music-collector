import { command, positional } from "cmd-ts";
import DateType from "../misc/date_argument_type.ts";


const getDate = command({
    name: "get",
    args: {
        date: positional({ type: DateType, displayName: "date", description: "for what date to get songs" })
    },
    handler: args => {
        console.log(`getting date`, args);
    }
});


export default getDate;
