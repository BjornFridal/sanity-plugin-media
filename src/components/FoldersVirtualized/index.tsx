import {Box, Text} from '@sanity/ui'
import {memo, useState} from 'react'
import {Virtuoso} from 'react-virtuoso'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectCurrentFolderId, selectFolderTree} from '../../modules/folders'
import type {FolderActions, FolderTreeItem} from '../../types'
import Folder from '../Folder'

const VirtualRow = memo(
  ({
    currentFolderId,
    isScrolling,
    item
  }: {
    currentFolderId: string | null | undefined
    isScrolling?: boolean
    item: FolderTreeItem & {
      actions: FolderActions[]
    }
  }) => {
    const isActive = item.folder.folder._id === currentFolderId
    // Render folder - only display actions if we're not in the process of scrolling
    return (
      <Folder
        actions={isScrolling ? undefined : item.actions}
        depth={item.depth}
        folder={item.folder}
        hasChildren={item.hasChildren}
        isActive={isActive}
        isExpanded={item.isExpanded}
        key={item.folder.folder._id}
      />
    )
  }
)

const FoldersVirtualized = () => {
  const currentFolderId = useTypedSelector(selectCurrentFolderId)
  const folderTree = useTypedSelector(selectFolderTree)

  // State
  const [isScrolling, setIsScrolling] = useState(false)

  // Map folders to include actions
  const items = folderTree.map(treeItem => ({
    ...treeItem,
    actions: ['navigate', 'edit', 'delete'] as FolderActions[]
  }))

  // Show message if no folders
  if (items.length === 0) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          No folders
        </Text>
      </Box>
    )
  }

  return (
    <Virtuoso
      className="media__custom-scrollbar"
      computeItemKey={index => {
        const item = folderTree[index]
        return item?.folder?.folder?._id || `${index}`
      }}
      isScrolling={setIsScrolling}
      itemContent={index => {
        return (
          <VirtualRow
            currentFolderId={currentFolderId}
            isScrolling={isScrolling}
            item={items[index]}
          />
        )
      }}
      style={{flex: 1, overflowX: 'hidden'}}
      totalCount={items.length}
    />
  )
}

export default FoldersVirtualized
