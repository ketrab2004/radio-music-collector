import { hasPlayedSongData, RadioPlayedSong } from "./played_song_type.ts";

export function parsePlayedSongs(body: string): RadioPlayedSong[] | string {
    if (body.length <= 0) {
        return "played song body is empty";
    }

    let json;
    try {
        json = JSON.parse(body);

    } catch (e) {
        return `failed to parse body to json; ${e}`;
    }

    if (!Array.isArray(json)) {
        return "body is not an array like expected";
    }
    if (!json.every(hasPlayedSongData)) {
        return "not each item in has the required structure";
    }

    if (json.length <= 0) {
        return "body is empty list";
    }

    return json;
}
