import { RadioPlayedSong } from "./played_song_type.ts";


export function getSongId(song: RadioPlayedSong): string {
    return `${song.rs_track}${song.rs_artist}`;
}
