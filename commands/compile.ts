import { command, option, multioption, flag, boolean, array, oneOf, optional, number } from "cmd-ts";
import { addDays, format, isBefore } from "date-fns";
import { DateRangeType } from "../misc/argument/index.ts";
import Radios, { Radio } from "../radios.ts";
import { parsePlayedSongs } from "../misc/parse_played_songs.ts";
import { RadioPlayedSong } from "../misc/played_song_type.ts";
import { getSongId } from "../misc/song_id.ts";


const compileList = command({
    name: "compile",
    args: {
        stations: multioption({
            long: "station",
            short: "S",
            description: "radio stations for which to compile music lists",
            type: array(oneOf(["all", ...Radios.map(r => r.name)]))
        }),
        ranges: option({
            long: "date",
            short: "D",
            description: "for what range of time to compile the data",
            type: DateRangeType
        }),
        requireAllDays: flag({
            type: boolean,
            long: "no-missing",
            description: "error if there is no data for every date in the range"
        }),
        outputFormat: option({
            type: oneOf(["json", "text"]),
            defaultValue: () => "json",
            long: "output",
            short: "O",
            description: "format of the output, json by default"
        }),
        order: option({
            type: oneOf(["chronological", "frequency"]),
            defaultValue: () => "chronological",
            long: "order",
            description: "order of the output songs, chronological by default"
        }),
        reversed: flag({
            type: boolean,
            long: "reverse",
            short: "R",
            description: "whether to reverse the order of the output"
        }),
        limit: option({
            type: optional(number),
            long: "limit",
            short: "L",
            description: "limit length of the output"
        }),
        unique: flag({
            type: boolean,
            long: "unique",
            short: "U",
            description: "whether to filter out duplicates"
        }),
    },
    handler: args => {
        const stations = getStations(args.stations);
        if (typeof stations == "string") {
            console.error(stations);
            return;
        }

        const decoder = new TextDecoder("utf-8");

        for (const station of stations) {
            console.group(`compiling for ${station.name}`);
            let total: RadioPlayedSong[] = [];

            for (const range of args.ranges.ranges) {
                for (let cur = range.start; isBefore(cur, range.end); cur = addDays(cur, 1)) {
                    const curStr = format(cur, "yyyy/MM/dd");
                    const path = `./data/${station.name}/${curStr}/raw.json`;

                    console.log(`loading ${curStr}`);

                    let content;
                    try {
                        content = decoder.decode( Deno.readFileSync(path) );

                    } catch (e) {
                        console.warn(`failed to read data for ${station.name} on ${curStr}; ${e}`);
                        continue;
                    }

                    const songs = parsePlayedSongs(content);

                    if (typeof songs == "string") {
                        const msg = `for ${station.name} on ${curStr} ${songs}`;
                        if (args.requireAllDays) {
                            console.error(msg);
                            return;
                        } else {
                            console.warn(msg);
                            continue;
                        }
                    }

                    total = total.concat(songs.reverse());
                }
            }

            total = total.filter(item => item.rs_track);;

            const songFrequencyMap = new Map<string, [RadioPlayedSong, number]>();
            for (const song of total) {
                const id = getSongId(song);

                let val = songFrequencyMap.get(id);
                if (val == undefined) {
                    val = [song, 0];
                    songFrequencyMap.set(id, val);
                }

                val[1] ++;
            }

            switch (args.order) {
                case "chronological":
                    break;

                case "frequency": {
                    total = total.sort((a, b) => songFrequencyMap.get(getSongId(b))![1] - songFrequencyMap.get(getSongId(a))![1]);

                    const p = total[0];
                    console.log(`highest frequency song ${p.rs_track} by ${p.rs_artist} played ${songFrequencyMap.get(getSongId(p))![1]} times`);

                    break;
                }
            }

            if (args.unique)
                total = total.reduce<[RadioPlayedSong[], Set<string>]>(([out, set], cur) => {
                    const id = getSongId(cur);
                    if (!set.has(id)) {
                        set.add(id);
                        out.push(cur);
                    }
                    return [out, set];

                }, [[], new Set()])[0]

            if (args.reversed)
                total.reverse();

            if (args.limit != undefined)
                total.splice(args.limit);


            const path = `./data/${station.name}/${args.ranges.raw}`;

            let ext = args.outputFormat,
                body;

            switch (args.outputFormat) {
                case "json":
                    body = JSON.stringify(total);
                    break;

                case "text":
                    ext = "txt";
                    body = total
                        .map(item => `${item.rs_artist.replace('-', '')} - ${item.rs_track.replace('-', '')}`)
                        .join("\n");
                    break;

                default:
                    console.error(`chosen output format '${args.outputFormat}' doesn't exist`);
                    return;
            }

            Deno.writeTextFileSync(`${path}.${ext}`, body, { create: true });

            console.log(`Output is ${total.length} songs long for ${station.name}`);
            console.groupEnd();
        }
    }
});

function getStations(stations: string[]): Radio[] | string {
    if (stations.length <= 0) {
        return "No stations specified";
    }

    if (stations.includes("all"))
        return Radios;

    const toReturn: Radio[] = [];

    for (const name of stations) {
        const station = Radios.find(s => s.name == name);

        if (station == undefined)
            return `Selected station ${name} could not be found`;

        toReturn.push(station);
    }

    return toReturn;
}


export default compileList;
