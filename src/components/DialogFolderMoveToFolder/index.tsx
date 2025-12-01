import {Box, Button, Flex, Select, Stack, Text} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {useDispatch} from 'react-redux'
import useTypedSelector from '../../hooks/useTypedSelector'
import {dialogActions} from '../../modules/dialog'
import {foldersActions, selectFolderById, selectFolders} from '../../modules/folders'
import type {DialogFolderMoveToFolderProps, FolderItem} from '../../types'
import getFolderSelectOptions from '../../utils/getFolderSelectOptions'
import Dialog from '../Dialog'

type Props = {
  children: ReactNode
  dialog: DialogFolderMoveToFolderProps
}

const DialogFolderMoveToFolder = (props: Props) => {
  const {
    children,
    dialog: {folderId, id}
  } = props

  const dispatch = useDispatch()
  const folders = useTypedSelector(selectFolders)
  const folderItem = useTypedSelector(state => selectFolderById(state, folderId))

  // Determine default folder (current parent)
  const defaultFolderId = folderItem?.folder?.parent?._ref || ''

  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId)

  const handleClose = () => {
    dispatch(dialogActions.remove({id}))
  }

  const isUpdating = folderItem?.updating

  const handleMove = () => {
    if (!folderItem?.folder) return

    const newParentId = selectedFolderId === '' ? null : selectedFolderId

    dispatch(
      foldersActions.moveRequest({
        closeDialogId: folderId,
        folder: folderItem.folder,
        folderId: newParentId
      })
    )
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMoveClick = () => {
    setIsSubmitting(true)
    handleMove()
  }

  // Close dialog when move operation completes
  if (isSubmitting && !isUpdating) {
    handleClose()
  }

  // Filter out the current folder and its descendants to prevent cycles
  // We also filter out the current parent to avoid "moving" to the same place (optional, but good UX)
  // Actually, keeping the current parent allows the user to see where it currently is.
  // But we definitely must filter out the folder itself and its children.

  const getDescendants = (parentId: string, allFolders: FolderItem[]): string[] => {
    const childFolders = allFolders.filter(f => f.folder.parent?._ref === parentId)
    let descendants = childFolders.map(f => f.folder._id as string)
    childFolders.forEach(child => {
      descendants = descendants.concat(getDescendants(child.folder._id as string, allFolders))
    })
    return descendants
  }

  const descendants = folderId ? getDescendants(folderId, folders) : []
  const invalidIds = [folderId, ...descendants]

  const validFolders = folders.filter(f => !invalidIds.includes(f.folder._id as string))

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="flex-end">
        {/* Cancel button */}
        <Box marginRight={2}>
          <Button fontSize={1} mode="bleed" onClick={handleClose} text="Cancel" tone="default" />
        </Box>

        {/* Move button */}
        <Button
          fontSize={1}
          loading={isUpdating}
          disabled={isUpdating || selectedFolderId === defaultFolderId}
          onClick={handleMoveClick}
          text="Move"
          tone="primary"
        />
      </Flex>
    </Box>
  )

  if (!folderItem?.folder) return null

  return (
    <Dialog
      animate
      footer={<Footer />}
      header="Move Folder"
      id={id}
      onClose={handleClose}
      width={1}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1}>Move "{folderItem.folder.name.current}" to:</Text>

          <Select
            fontSize={2}
            onChange={e => setSelectedFolderId(e.currentTarget.value)}
            padding={3}
            value={selectedFolderId}
          >
            <option value="">Root</option>
            {getFolderSelectOptions(validFolders).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Stack>
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogFolderMoveToFolder
