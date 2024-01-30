import { command, positional } from "cmd-ts";
import { format } from "date-fns";
import DateType from "../misc/date_argument_type.ts";
import Radios from "../radios.ts";
import { delayedFetch } from "../misc/fetch_runner.ts";


const getDate = command({
    name: "get",
    args: {
        date: positional({ type: DateType, displayName: "date", description: "for what date to get songs" })
    },
    handler: args => {
        const date = format(args.date, "yyyy-MM-dd");

        console.log(`getting songs for ${date}`);

        let handledRadioStations = 0;

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
                    console.log(`got response for ${radio.name} and started parsing it`);

                    if (body.length <= 0) {
                        throw `request for ${radio.name} failed and returned nothing`;
                    }

                    let json;
                    try {
                        json = JSON.parse(body);
                    } catch (e) {
                        console.error(e);
                        throw `failed to parse result for ${radio.name} to json`;
                    }

                    if (!Array.isArray(json)) {
                        throw `returned json for ${radio.name} isn't array like expected`;
                    }

                    if (json.length <= 0) {
                        throw `returned played music list for ${radio.name} is empty, is the given date not too far in the past?`;
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

                    if (handledRadioStations >= Radios.length) {
                        console.log(`finished getting music played on ${Radios.length} radio stations on ${date} succesfully!`);
                    }
                });
        }
    }
});


export default getDate;
