import { Type } from "cmd-ts";
import { parseDate } from "chrono";

const Date: Type<string, Date> = {
    displayName: "date time",
    description: "parses given date string to date using Chrono (so 'yesterday' is supported)",
    from: async input => {
        const result = parseDate(input);

        if (result === null) {
            throw new Error(`failed to parse date '${input}'`);
        }

        return result;
    }
}

export default Date;
