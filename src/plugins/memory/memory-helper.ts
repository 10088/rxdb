import { getIndexableString } from '../../custom-index';
import type { BulkWriteRow, RxDocumentData, RxJsonSchema } from '../../types';
import type { DocWithIndexString, MemoryStorageInternals } from './memory-types';
import type { RxStorageInstanceMemory } from './rx-storage-instance-memory';
import {
    pushAtSortPosition
} from 'array-push-at-sort-position';
import { newRxError } from '../../rx-error';
import { boundEQ } from './binary-search-bounds';


export function getMemoryCollectionKey(
    databaseName: string,
    collectionName: string
): string {
    return databaseName + '--memory--' + collectionName;
}


export function ensureNotRemoved(
    instance: RxStorageInstanceMemory<any>
) {
    if (instance.internals.removed) {
        throw new Error('removed');
    }
}

export function putWriteRowToState<RxDocType>(
    primaryPath: string,
    schema: RxJsonSchema<RxDocumentData<RxDocType>>,
    state: MemoryStorageInternals<RxDocType>,
    row: BulkWriteRow<RxDocType>,
    docInState?: RxDocumentData<RxDocType>
) {
    const docId: string = (row.document as any)[primaryPath];
    state.documents.set(docId, row.document);


    Object.values(state.byIndex).forEach(byIndex => {
        const docsWithIndex = byIndex.docsWithIndex;
        const newIndexString = getIndexableString(schema, byIndex.index, row.document);

        const [, insertPosition] = pushAtSortPosition(
            docsWithIndex,
            {
                id: docId,
                doc: row.document,
                indexString: newIndexString
            },
            (a: DocWithIndexString<RxDocType>, b: DocWithIndexString<RxDocType>) => {
                if (a.indexString < b.indexString) {
                    return -1;
                } else {
                    return 1;
                }
            },
            true
        );


        /**
         * Remove previous if it was in the state
         */
        if (docInState) {
            const previousIndexString = getIndexableString(schema, byIndex.index, docInState);
            if (previousIndexString === newIndexString) {
                /**
                 * Index not changed -> The old doc must be before or after the new one.
                 */
                const prev = docsWithIndex[insertPosition - 1];
                if (prev && prev.id === docId) {
                    docsWithIndex.splice(insertPosition - 1, 1)
                } else {
                    const next = docsWithIndex[insertPosition + 1];
                    if (next.id === docId) {
                        docsWithIndex.splice(insertPosition + 1, 1)
                    } else {
                        throw newRxError('SNH', {
                            args: {
                                row,
                                byIndex
                            }
                        });
                    }
                }
            } else {
                /**
                 * Index changed, we must search for the old one and remove it.
                 */
                const indexBefore = boundEQ(
                    docsWithIndex,
                    {
                        indexString: previousIndexString
                    } as any,
                    compareDocsWithIndex
                );
                docsWithIndex.splice(indexBefore, 1)
            }
        }
    });
}


export function removeDocFromState<RxDocType>(
    primaryPath: string,
    schema: RxJsonSchema<RxDocumentData<RxDocType>>,
    state: MemoryStorageInternals<RxDocType>,
    doc: RxDocumentData<RxDocType>
) {
    const docId: string = (doc as any)[primaryPath];
    state.documents.delete(docId);

    Object.values(state.byIndex).forEach(byIndex => {
        const docsWithIndex = byIndex.docsWithIndex;
        const indexString = getIndexableString(schema, byIndex.index, doc);

        const positionInIndex = boundEQ(
            docsWithIndex,
            {
                indexString
            } as any,
            compareDocsWithIndex
        );
        docsWithIndex.splice(positionInIndex, 1);
    });
}


export function compareDocsWithIndex<RxDocType>(
    a: DocWithIndexString<RxDocType>,
    b: DocWithIndexString<RxDocType>
): 1 | 0 | -1 {
    if (a.indexString < b.indexString) {
        return -1;
    } else if (a.indexString === b.indexString) {
        return 0;
    } else {
        return 1;
    }
}
