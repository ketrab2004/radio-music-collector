import { command, positional, option, flag, optional, number, boolean } from "cmd-ts";
import { format } from "date-fns";
import * as gh from "@action/core";
import { GhLogger, SimpleLogger } from "../misc/logger.ts";
import { DateType } from "../misc/argument/index.ts";
import Radios from "../radios.ts";
import ThrottledTaskRunner from "../misc/throttled_task_runner.ts";
import { parsePlayedSongs } from "../misc/parse_played_songs.ts";


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
        const logger = args.githubAction ? new GhLogger() : new SimpleLogger();

        const runner = new ThrottledTaskRunner(args.fetchDelay);

        const date = format(args.date, "yyyy-MM-dd");
        logger.info(`getting songs for ${date}`);

        let handledRadioStations = 0,
            failedToHandleRadioStations = 0;

        const ghSummaryRows: string[][] = [];

        for (const radio of Radios) {
            let task: Promise<void>;

            if (!radio.canBeFetched) {
                task = runner.addTask(() => {
                    handledRadioStations ++;

                    logger.notice(`Skipped ${radio.name}`, `skipping over ${radio.name}, as fetching it has been disabled`);

                    ghSummaryRows.push([`${handledRadioStations}.`, "ℹ️", radio.name, "-", "fetching for this station is disabled"]);

                    return Promise.resolve();
                }, 0);

            } else {
                const body = `rid=${radio.rid}&rs_id=${radio.rs_id ?? 0}&date=${date}&hash=${radio.hash ?? ''}`;

                task = runner.addTask(() => fetch(`${radio.domain}/get-song`, {
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

                        logger.group(`parsing ${radio.name} response`);

                        const result = parsePlayedSongs(body);

                        if (typeof result == "string") {
                            const msg = `for ${radio.name} ${result}`;
                            logger.warn(`Request for ${radio.name} failed`, msg);

                            failedToHandleRadioStations ++;

                            ghSummaryRows.push([`${handledRadioStations}.`, "❌", radio.name, "-", msg]);
                            return;
                        }

                        const path = `./data/${radio.name}/${format(date, "yyyy/MM/dd")}`;

                        Deno.mkdirSync(path, { recursive: true });
                        Deno.writeTextFileSync(`${path}/raw.json`, body, { create: true });

                        ghSummaryRows.push([`${handledRadioStations}.`, "✅", radio.name, result.length.toString(), ""]);
                    });
            }

            task.finally(() => {
                logger.groupEnd();

                if (handledRadioStations < Radios.length)
                    return;

                logger.info(`finished getting music played on ${Radios.length - failedToHandleRadioStations}/${Radios.length} radio stations on ${date} successfully!`);

                if (args.githubAction) {
                    gh.summary
                        .addHeading("Results")
                        .addTable([
                            ["#", "Result", "Radio", "Songs", "Message"],
                            ...ghSummaryRows
                        ])
                        .write();
                }

                if (failedToHandleRadioStations <= 0)
                    return;

                const title = "Failed to get songs for all radio stations";
                const msg = `failed to get songs for ${failedToHandleRadioStations} radio station(s)`;

                if (args.requireAllStations || failedToHandleRadioStations == Radios.length) {
                    logger.error(title, msg);
                } else {
                    logger.warn(title, msg);
                }
            });
        }
    }
});


export default getDate;
