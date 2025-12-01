import {Box, Flex} from '@sanity/ui'
import {FOLDER_ROOT_ID, FOLDER_SEE_ALL_ID} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectCurrentFolderId} from '../../modules/folders'
import type {FolderItem} from '../../types'
import Folder from '../Folder'
import FoldersVirtualized from '../FoldersVirtualized'
import FolderViewHeader from '../FolderViewHeader'

const rootFolder: FolderItem = {
  _type: 'folder',
  folder: {
    _id: FOLDER_ROOT_ID,
    _rev: '',
    _type: 'media.folder',
    _createdAt: '',
    _updatedAt: '',
    name: {
      _type: 'slug',
      current: 'Root'
    }
  },
  picked: false,
  updating: false
}

const seeAllFolder: FolderItem = {
  _type: 'folder',
  folder: {
    _id: FOLDER_SEE_ALL_ID,
    _rev: '',
    _type: 'media.folder',
    _createdAt: '',
    _updatedAt: '',
    name: {
      _type: 'slug',
      current: 'Show all assets'
    }
  },
  picked: false,
  updating: false
}

const FolderView = () => {
  const fetchCount = useTypedSelector(state => state.folders.fetchCount)
  const fetchComplete = fetchCount !== -1
  const currentFolderId = useTypedSelector(selectCurrentFolderId)

  return (
    <Flex direction="column" flex={1} height="fill">
      <Box>
        <FolderViewHeader allowCreate title="Folders" />
        <Box paddingTop={2} paddingBottom={0}>
          <Folder folder={rootFolder} isActive={currentFolderId === FOLDER_ROOT_ID} />
        </Box>
      </Box>

      {/* Always show virtualized list - it will display "No subfolders" if empty */}
      {fetchComplete && <FoldersVirtualized />}

      <Box paddingY={2} style={{borderTop: '1px solid var(--card-border-color)'}}>
        <Folder folder={seeAllFolder} isActive={currentFolderId === FOLDER_SEE_ALL_ID} />
      </Box>
    </Flex>
  )
}

export default FolderView
