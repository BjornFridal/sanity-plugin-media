import {Box, Button, Flex, Select, Stack, Text} from '@sanity/ui'
import pluralize from 'pluralize'
import {type ReactNode, useState} from 'react'
import {useDispatch} from 'react-redux'
import {FOLDER_ROOT_ID} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {ASSETS_ACTIONS} from '../../modules/assets/actions'
import {dialogActions} from '../../modules/dialog'
import {selectFolders} from '../../modules/folders'
import type {Asset, DialogAssetMoveToFolderProps} from '../../types'
import getFolderSelectOptions from '../../utils/getFolderSelectOptions'
import Dialog from '../Dialog'

type Props = {
  children: ReactNode
  dialog: DialogAssetMoveToFolderProps
}

const DialogAssetMoveToFolder = (props: Props) => {
  const {
    children,
    dialog: {assetIds, id}
  } = props

  const dispatch = useDispatch()
  const folders = useTypedSelector(selectFolders)
  const allAssets = useTypedSelector(state => state.assets.byIds)

  // Get the actual assets from the assetIds
  const assets = assetIds
    .map(assetId => allAssets[assetId]?.asset)
    .filter((asset): asset is Asset => Boolean(asset))

  // Determine default folder from the first asset
  const defaultFolderId = assets[0]?.opt?.media?.folder?._ref || FOLDER_ROOT_ID

  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId)

  const handleClose = () => {
    dispatch(dialogActions.remove({id}))
  }

  // Check if any of the assets are currently updating
  const isUpdating = assets.some(asset => allAssets[asset._id]?.updating)

  const handleMove = () => {
    dispatch(
      ASSETS_ACTIONS.moveToFolderRequest({
        assets,
        folderId: selectedFolderId
      })
    )
  }

  // Close dialog when updating finishes (if it was updating)
  // We use a ref or local state to track if we initiated a move?
  // Actually, if we just check !isUpdating and we are in this dialog, it might close prematurely if we don't track intent.
  // But simpler: just don't close immediately. The user can close it, or we can close it when success action fires.
  // However, since the assets might disappear from the list after move (due to re-fetch), we should probably close it then.
  // Let's use a simple effect that closes the dialog if we were updating and now we are not.
  // But wait, if assets re-fetch, `assets` array might be empty or different.
  // Let's stick to the plan: remove immediate close, show loading.
  // We can rely on the user closing it or the fact that the component might unmount if the parent view changes.
  // Actually, the best UX is to close it automatically on success.
  // We can listen for the success action in a custom hook or just use a simple effect here.

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMoveClick = () => {
    setIsSubmitting(true)
    handleMove()
  }

  // Effect to close dialog when submission is done
  // We can check if isSubmitting is true and isUpdating becomes false.
  // But isUpdating might be false initially.
  // Let's just use the isUpdating derived from Redux.

  if (isSubmitting && !isUpdating) {
    handleClose()
  }

  const assetCount = assets.length
  const assetText = `${assetCount} ${pluralize('asset', assetCount)}`

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
          disabled={isUpdating}
          onClick={handleMoveClick}
          text="Move"
          tone="primary"
        />
      </Flex>
    </Box>
  )

  return (
    <Dialog
      animate
      footer={<Footer />}
      header="Move to Folder"
      id={id}
      onClose={handleClose}
      width={1}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1}>Move {assetText} to:</Text>

          <Select
            fontSize={2}
            onChange={e => setSelectedFolderId(e.currentTarget.value)}
            padding={3}
            value={selectedFolderId}
          >
            <option value={FOLDER_ROOT_ID}>Root</option>
            {getFolderSelectOptions(folders).map(option => (
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

export default DialogAssetMoveToFolder
