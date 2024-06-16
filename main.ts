import { run, subcommands } from "cmd-ts";
import { get, compile } from "./commands/index.ts";

if (!import.meta.main) {
    throw "can't run main as not main";
}


const app = subcommands({
    name: "radio-music-collector",
    description: "Collects and handle music played at music stations.",
    cmds: { get, compile }
});


run(app, Deno.args);
