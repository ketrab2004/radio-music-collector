import { format } from "date-fns";
import { hasPlayedSongData } from "../../misc/played_song_type.ts";
import { Radio } from "../../radios.ts";

export default function handleStation(radio: Radio, date: Date, body: string): true | { title: string, msg: string } {
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
