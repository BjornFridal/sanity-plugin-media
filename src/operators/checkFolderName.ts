import type {SanityClient} from '@sanity/client'
import type {HttpError} from '../types'
import groq from 'groq'
import {from, Observable, of, throwError} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import {FOLDER_DOCUMENT_NAME} from '../constants'

const checkFolderName = (
  client: SanityClient,
  name: string,
  parentId?: string,
  currentFolderId?: string
) => {
  return function <T>(source: Observable<T>): Observable<boolean> {
    return source.pipe(
      mergeMap(() => {
        // Build query to check for folder with same name in same parent
        const parentFilter = parentId ? `parent._ref == $parentId` : `!defined(parent)`

        // Exclude current folder from check when updating
        const excludeCurrent = currentFolderId ? ` && _id != $currentFolderId` : ''

        const query = groq`count(*[
          _type == "${FOLDER_DOCUMENT_NAME}"
          && name.current == $name
          && ${parentFilter}
          ${excludeCurrent}
        ])`

        return from(
          client.fetch(query, {
            name,
            ...(parentId && {parentId}),
            ...(currentFolderId && {currentFolderId})
          })
        ) as Observable<number>
      }),
      mergeMap((existingFolderCount: number) => {
        if (existingFolderCount > 0) {
          return throwError({
            message: 'A folder with this name already exists in this location',
            statusCode: 409
          } as HttpError)
        }

        return of(true)
      })
    )
  }
}

export default checkFolderName
