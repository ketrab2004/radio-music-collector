import { command, positional } from "cmd-ts";
import { format } from "date-fns";
import DateType from "../misc/date_argument_type.ts";
import Radios from "../radios.ts";
import { delayedFetch } from "../misc/fetch_runner.ts";


export type RadioPlayedSong = {
    rs_track: string;
    rs_artist: string;
}
export function hasPlayedSongData(item: {[key: string]: unknown}): item is RadioPlayedSong {
    if (typeof item["rs_track"] != "string") {
        return false;
    }
    if (typeof item.rs_artist != "string") {
        return false;
    }

    return true;
}


const getDate = command({
    name: "get",
    args: {
        date: positional({ type: DateType, displayName: "date", description: "for what date to get songs" })
    },
    handler: args => {
        const date = format(args.date, "yyyy-MM-dd");

        console.log(`getting songs for ${date}`);

        let handledRadioStations = 0,
            failedToHandleRadioStations = 0;

        for (const radio of Radios) {
            const body = `rid=${radio.rid}&rs_id=${radio.rs_id ?? 0}&date=${date}&hash=${radio.hash ?? ''}`;

            delayedFetch(`${radio.domain}/get-song`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "content-length": body.length.toString(),
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",

                    accept: "application/json, text/javascript, */*; q=0.01",

                    "user-agent": "githubPipelineRunner",
                    origin: "https://github.com/ketrab2004/radio-music-collector",
                    referer: radio.domain,
                    "x-requested-with": "XMLHttpRequest"
                },
                body
            })
                .then(response => response.text())
                .then(body => {
                    handledRadioStations ++;
                    failedToHandleRadioStations ++;
                    console.log(`got response for ${radio.name} and started parsing it`);
                    console.group();

                    if (body.length <= 0) {
                        console.warn(`request for ${radio.name} failed and returned nothing`);
                        return;
                    }

                    let json;
                    try {
                        json = JSON.parse(body);
                    } catch (e) {
                        console.warn(`failed to parse result for ${radio.name} to json`, e);
                        return;
                    }

                    if (!Array.isArray(json)) {
                        console.warn(`returned json for ${radio.name} isn't array like expected`);
                        return;
                    }
                    if (!json.every(hasPlayedSongData)) {
                        console.warn(`not each item in returned array for ${radio.name} has the required properties`);
                        return;
                    }

                    if (json.length <= 0) {
                        console.warn(`returned played music list for ${radio.name} is empty, is the given date not too far in the past?`);
                        return;
                    }

                    const path = `./data/${radio.name}/${format(date, "yyyy/MM/dd")}`;

                    Deno.mkdirSync(path, { recursive: true });

                    Deno.writeTextFileSync(`${path}/raw.json`, body, { create: true });
                    Deno.writeTextFileSync(
                        `${path}/list.txt`,
                        json
                            .filter(item => item.rs_track)
                            .reverse()
                            .map(item => `${item.rs_artist.replace('-', '')} - ${item.rs_track.replace('-', '')}`)
                            .reduce<[string[], Set<string>]>(([out, set], cur) => { // filter duplicates
                                if (!set.has(cur)) {
                                    out.push(cur);
                                    set.add(cur);
                                }

                                return [out, set];

                            }, [[], new Set()])[0]
                            .join("\n"),
                        { create: true }
                    );

                    // no early return happened, so we didn't need to increase after all...
                    failedToHandleRadioStations --;

                }).finally(() => {
                    console.groupEnd();
                    if (handledRadioStations >= Radios.length) {
                        console.log(`finished getting music played on ${Radios.length - failedToHandleRadioStations}/${Radios.length} radio stations on ${date} successfully!`);

                        if (failedToHandleRadioStations > 0) {
                            throw `failed to get songs for ${failedToHandleRadioStations} radio station(s)`;
                        }
                    }
                });
        }
    }
});


export default getDate;
