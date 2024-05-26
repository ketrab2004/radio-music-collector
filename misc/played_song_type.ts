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
