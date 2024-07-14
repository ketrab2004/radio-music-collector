import pause from "./pause.ts";


type QueueItem<T> = [
    runner: () => Promise<T>,
    resolver: (result: T) => void,
    // deno-lint-ignore no-explicit-any
    reject: (reason?: any) => void
];

export default class ThrottledTaskRunner {
    protected queue: QueueItem<unknown>[] = [];
    protected running = false;

    public delay: number;

    constructor(delayMs: number = 2358.13) {
        this.delay = delayMs;
    }


    public isRunning(): boolean {
        return this.running;
    }

    public addTask<T = unknown>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push([
                task,
                resolve as (value: unknown) => void, // typescript isn't smart enough to cast T | PromiseLike<T> to unknown
                reject
            ]);

            this.runStack();
        });
    }

    protected async runStack() {
        if (this.running) {
            return;
        }
        this.running = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item) {
                break;
            }

            try {
                item[1](await item[0]());

            } catch(e) {
                console.warn(`Task in ThrottledTaskRunner failed, ${e}`);
                item[2](e);
            }

            await pause(this.delay);
        }

        this.running = false;
    }
}
