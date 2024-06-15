import { command, positional, option, flag, optional, number, boolean } from "cmd-ts";
import { format } from "date-fns";
import * as ghActionCore from "@action/core";
import { DateType } from "../misc/date_argument_type.ts";
import Radios, { Radio } from "../radios.ts";
import ThrottledTaskRunner from "../misc/throttled_task_runner.ts";
import { hasPlayedSongData } from "../misc/played_song_type.ts";


const getDate = command({
    name: "get",
    args: {
        date: positional({
            type: DateType,
            displayName: "date",
            description: "for what date to get songs"
        }),
        fetchDelay: option({
            type: optional(number),
            long: "fetchDelay",
            short: "D",
            description: "delay in milliseconds between each fetch",
        }),
        requireAllStations: flag({
            type: boolean,
            long: "allStations",
            short: "S",
            description: "require all stations, erroring if not all succeeded"
        }),
        githubAction: flag({
            type: boolean,
            long: "gh-action",
            description: "enables github action related logs for setting results, logging, registering secrets and exporting variables across actions"
        })
    },
    handler: args => {
        const gh = args.githubAction ? ghActionCore : undefined;

        const runner = new ThrottledTaskRunner<Response>(args.fetchDelay);

        const date = format(args.date, "yyyy-MM-dd");
        console.log(`getting songs for ${date}`);

        let handledRadioStations = 0,
            failedToHandleRadioStations = 0;

        const ghSummaryRows: string[][] = [];

        for (const radio of Radios) {
            const body = `rid=${radio.rid}&rs_id=${radio.rs_id ?? 0}&date=${date}&hash=${radio.hash ?? ''}`;

            runner.addTask(() => fetch(`${radio.domain}/get-song`, {
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
            }))
                .then(response => response.text())
                .then(body => {
                    handledRadioStations ++;

                    console.log(`got response for ${radio.name} and started parsing it`);
                    console.group();

                    const result = parseRequest(radio, args.date, body);

                    if (result !== true) {
                        console.warn(result.msg);
                        gh?.warning(result.msg, {
                            title: result.title
                        });
                        ghSummaryRows.push([`${handledRadioStations}.`, "❌", radio.name, result.msg]);

                        failedToHandleRadioStations ++;

                    } else {
                        ghSummaryRows.push([`${handledRadioStations}.`, "✅", radio.name, ""]);
                    }

                }).finally(() => {
                    console.groupEnd();
                    if (handledRadioStations < Radios.length)
                        return;

                    console.log(`finished getting music played on ${Radios.length - failedToHandleRadioStations}/${Radios.length} radio stations on ${date} successfully!`);

                    if (gh != undefined) {
                        gh.summary
                            .addHeading("Results")
                            .addTable([
                                ["#", "Result", "Radio", "Message"],
                                ...ghSummaryRows
                            ])
                            .write();
                    }

                    if (failedToHandleRadioStations <= 0)
                        return;

                    const title = "Failed to get songs for all radio stations";
                    const msg = `failed to get songs for ${failedToHandleRadioStations} radio station(s)`;

                    if (args.requireAllStations || failedToHandleRadioStations == Radios.length) {
                        gh?.error(msg, { title });
                        throw msg;

                    } else {
                        console.warn(msg);
                        gh?.warning(msg, { title });
                    }
                });
        }
    }
});

function parseRequest(radio: Radio, date: Date, body: string): true | { title: string, msg: string } {
    const warnTitle = `Request for ${radio.name} failed`;

    if (body.length <= 0) {
        return {
            title: warnTitle,
            msg: `request for ${radio.name} failed and returned nothing`
        };
    }

    let json;
    try {
        json = JSON.parse(body);
    } catch (e) {
        return {
            title: warnTitle,
            msg: `failed to parse result for ${radio.name} to json ${e}`
        };
    }

    if (!Array.isArray(json)) {
        return {
            title: warnTitle,
            msg: `returned json for ${radio.name} isn't array like expected`
        };
    }
    if (!json.every(hasPlayedSongData)) {
        return {
            title: warnTitle,
            msg: `not each item in returned array for ${radio.name} has the required properties`
        };
    }

    if (json.length <= 0) {
        return {
            title: warnTitle,
            msg: `returned played music list for ${radio.name} is empty, is the given date not too far in the past?`
        };
    }

    const path = `./data/${radio.name}/${format(date, "yyyy/MM/dd")}`;

    Deno.mkdirSync(path, { recursive: true });

    Deno.writeTextFileSync(`${path}/raw.json`, body, { create: true });
    //TODO move this to a different command
    // Deno.writeTextFileSync(
    //     `${path}/list.txt`,
    //     json
    //         .filter(item => item.rs_track)
    //         .reverse()
    //         .map(item => `${item.rs_artist.replace('-', '')} - ${item.rs_track.replace('-', '')}`)
    //         .reduce<[string[], Set<string>]>(([out, set], cur) => { // filter duplicates
    //             if (!set.has(cur)) {
    //                 out.push(cur);
    //                 set.add(cur);
    //             }

    //             return [out, set];

    //         }, [[], new Set()])[0]
    //         .join("\n"),
    //     { create: true }
    // );

    return true;
}


export default getDate;
