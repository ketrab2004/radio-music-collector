import { Type } from "cmd-ts";
import { parse, ParsedComponents, Component, ParsedResult } from "chrono";
import {
    endOfDay, endOfHour, endOfMinute, endOfMonth, endOfSecond, endOfYear,
    startOfDay, startOfHour, startOfMinute, startOfMonth, startOfSecond, startOfYear
} from "date-fns";


export type DateRange = {
    precision: DatePrecision,
    start: Date,
    end: Date
};

export type DateRangeResult = {
    raw: string,
    ranges: DateRange[]
}

export enum DatePrecision {
    YEAR,
    MONTH,
    DAY,
    HOUR,
    MINUTE,
    SECOND
}

export const DateRangeType: Type<string, DateRangeResult> = {
    displayName: "date time range",
    description: "parses given date string to date range using Chrono",
    from: async input => {
        const results = parse(input);

        if (results.length <= 0) {
            throw new Error(`failed to parse date '${input}'`);
        }

        return {
            raw: input,
            ranges: results.map(prepareDateRange)
        }
    }
}

function prepareDateRange(raw: ParsedResult): DateRange {
    const end = raw.end ?? raw.start;

    const startPrecision = getComponentPrecision(raw.start),
        endPrecision = getComponentPrecision(end);
    const precision = Math.max(startPrecision, endPrecision);

    return {
        precision,
        start: getDateStartBasedOnPrecision(raw.start.date(), startPrecision),
        end: getDateEndBasedOnPrecision(end.date(), endPrecision)
    };
}

function getDateStartBasedOnPrecision(date: Date, precision: DatePrecision): Date {
    switch (precision) {
        case DatePrecision.YEAR:
            return startOfYear(date);
        case DatePrecision.MONTH:
            return startOfMonth(date);
        case DatePrecision.DAY:
            return startOfDay(date);
        case DatePrecision.HOUR:
            return startOfHour(date);
        case DatePrecision.MINUTE:
            return startOfMinute(date);
        case DatePrecision.SECOND:
            return startOfSecond(date);

        default:
            throw `Not yet implemented date precision given ${precision}`
    }
}

function getDateEndBasedOnPrecision(date: Date, precision: DatePrecision): Date {
    switch (precision) {
        case DatePrecision.YEAR:
            return endOfYear(date);
        case DatePrecision.MONTH:
            return endOfMonth(date);
        case DatePrecision.DAY:
            return endOfDay(date);
        case DatePrecision.HOUR:
            return endOfHour(date);
        case DatePrecision.MINUTE:
            return endOfMinute(date);
        case DatePrecision.SECOND:
            return endOfSecond(date);

        default:
            throw `Not yet implemented date precision given ${precision}`
    }
}

function getComponentPrecision(date: ParsedComponents): DatePrecision {
    const componentToPrecision: [Component, DatePrecision][] = [
        ["second", DatePrecision.SECOND],
        ["minute", DatePrecision.MINUTE],
        ["hour", DatePrecision.HOUR],
        ["day", DatePrecision.DAY],
        ["month", DatePrecision.MONTH],
        ["year", DatePrecision.YEAR]
    ];

    for (const [comp, precision] of componentToPrecision) {
        if (date.isCertain(comp))
            return precision;
    }

    throw `Somehow given date ${date} has no components specified`;
}
