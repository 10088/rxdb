/**
 * RxChangeEvents a emitted when something in the database changes
 * they can be grabbed by the observables of database, collection and document
 */

import {
    ChangeEvent as EventReduceChangeEvent,
} from 'event-reduce-js';
import { overwritable } from './overwritable';

import type {
    EventBulk,
    RxChangeEvent
} from './types';

export type RxChangeEventBroadcastChannelData = {
    cE: RxChangeEvent<any>,
    storageToken: string
};

export function getDocumentDataOfRxChangeEvent<T>(
    rxChangeEvent: RxChangeEvent<T>
): T {
    if ((rxChangeEvent as any).documentData) {
        return (rxChangeEvent as any).documentData;
    } else {
        return (rxChangeEvent as any).previousDocumentData;
    }

}

export function isRxChangeEventIntern(
    rxChangeEvent: RxChangeEvent<any>
): boolean {
    if (rxChangeEvent.collectionName && rxChangeEvent.collectionName.charAt(0) === '_') {
        return true;
    } else {
        return false;
    }
}


export function rxChangeEventToEventReduceChangeEvent<DocType>(
    rxChangeEvent: RxChangeEvent<DocType>
): EventReduceChangeEvent<DocType> {
    switch (rxChangeEvent.operation) {
        case 'INSERT':
            return {
                operation: rxChangeEvent.operation,
                id: rxChangeEvent.documentId,
                doc: rxChangeEvent.documentData as any,
                previous: null
            };
        case 'UPDATE':
            return {
                operation: rxChangeEvent.operation,
                id: rxChangeEvent.documentId,
                doc: overwritable.deepFreezeWhenDevMode(rxChangeEvent.documentData) as any,
                previous: rxChangeEvent.previousDocumentData ? rxChangeEvent.previousDocumentData as any : 'UNKNOWN'
            };
        case 'DELETE':
            return {
                operation: rxChangeEvent.operation,
                id: rxChangeEvent.documentId,
                doc: null,
                previous: rxChangeEvent.previousDocumentData as DocType
            };
    }
}

/**
 * Flattens the given events into a single array of events.
 * Used mostly in tests.
 */
export function flattenEvents<EventType>(
    input: EventBulk<EventType> | EventBulk<EventType>[] | EventType | EventType[]
): EventType[] {
    let output: EventType[] = [];

    if (Array.isArray(input)) {
        input.forEach(inputItem => {
            const add = flattenEvents(inputItem);
            output = output.concat(add);
        });
    } else {
        if ((input as any).id && (input as any).events) {
            // is bulk
            (input as EventBulk<EventType>)
                .events
                .forEach(ev => output.push(ev));
        } else {
            output.push(input as any);
        }
    }

    const usedIds = new Set<string>();
    const nonDuplicate: EventType[] = [];
    output.forEach(ev => {
        if (!usedIds.has((ev as any).eventId)) {
            usedIds.add((ev as any).eventId);
            nonDuplicate.push(ev);
        }
    });

    return nonDuplicate;
}
