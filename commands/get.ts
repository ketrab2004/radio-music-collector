import { command } from "cmd-ts";


const getDate = command({
    name: "get",
    args: {

    },
    handler: args => {
        console.log(`getting date`, args);
    }
});


export default getDate;
