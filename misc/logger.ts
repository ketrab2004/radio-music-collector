import * as gh from "@action/core";

export abstract class Logger {
    abstract info(message: string): void;
    abstract notice(title: string, message: string): void;
    abstract warn(title: string, message: string): void;
    abstract error(title: string, message: string): void;

    abstract group(name: string): void;
    abstract groupEnd(): void;
}

export class SimpleLogger extends Logger {
    info = console.log;
    notice(title: string, message: string): void {
        console.info(message);
    }
    warn(title: string, message: string): void {
        console.warn(message);
    }
    error(title: string, message: string): void {
        console.error(message);
    }

    group = console.group;
    groupEnd = console.groupEnd;
}

export class GhLogger extends Logger {
    info = console.info;
    notice(title: string, message: string): void {
        gh.notice(message, { title });
    }
    warn(title: string, message: string): void {
        gh.warning(message, { title });
    }
    error(title: string, message: string): void {
        gh.error(message, { title });
    }

    group(name?: string): void {
        gh.startGroup(name ?? "");
    }
    groupEnd(): void {
        gh.endGroup();
    }
}
