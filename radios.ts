export type Radio = {
    name: string,
    domain: string,
    rid: number,
    rs_id?: number,
    hash?: string
};

export const radios: Radio[] = [
    {
        name: "Pogoda",
        domain: "https://myradioonline.pl/",
        rid: 184
    },
    {
        name: "Sublime",
        domain: "https://myonlineradio.nl/",
        rid: 25
    }, {
        name: "Sublime Soul",
        domain: "https://myonlineradio.nl/",
        rid: 25,
        rs_id: 8697260,
        hash: "5e5604312dfc81967b7c5ad29604ca76"
    }, {
        name: "Sublime Smooth",
        domain: "https://myonlineradio.nl/",
        rid: 25,
        rs_id: 8678180,
        hash: "e42b204798a21435aa589a54c58dfc2b"
    }, {
        name: "Sublime Classics",
        domain: "https://myonlineradio.nl/",
        rid: 25,
        rs_id: 8699254,
        hash: "d9b0e41eb4c65a98329fae1ccda1fc8e"
    }, {
        name: "Sublime Funk & Disco",
        domain: "https://myonlineradio.nl/",
        rid: 25,
        rs_id: 8699310,
        hash: "1e050079ad4db07f50e1468492ff8d2a"
    }, {
        name: "Sublime Jazz",
        domain: "https://myonlineradio.nl/",
        rid: 25,
        rs_id: 8698771,
        hash: "03d588b4a8b8f12ba2f3614d3d52355f"
    },
    {
        name: "Joe",
        domain: "https://myonlineradio.nl/",
        rid: 60
    },
    {
        name: "NPO Klassiek",
        domain: "https://myonlineradio.nl/",
        rid: 28
    },
];

export default radios;
