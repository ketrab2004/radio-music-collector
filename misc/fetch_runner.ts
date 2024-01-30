import pause from "./pause.ts";

const fetchDelayMs = 2500;

type StackItem = {
    params: Parameters<typeof fetch>,
    resolver: (result: Response) => void
};
const stack: StackItem[] = [];

let runningStack = false;


export function delayedFetch(...params: Parameters<typeof fetch>): ReturnType<typeof fetch> {
    const promise = new Promise<Response>(resolver => {
        stack.push({ resolver, params });
    });

    runStack();

    return promise;
}

async function runStack() {
    if (runningStack) {
        return;
    }

    runningStack = true;

    while (stack.length > 0) {
        const item = stack.shift();
        if (!item) {
            break;
        }


        const response = await fetch(...item.params);
        item.resolver(response);

        await pause(fetchDelayMs);
    }

    runningStack = false;
}
