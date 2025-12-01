import {ChevronDownIcon, ChevronRightIcon, EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Container, Flex, Text, Tooltip} from '@sanity/ui'
import {type MouseEvent, type ReactNode, useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {styled} from 'styled-components'
import {dialogActions} from '../../modules/dialog'
import {DIALOG_ACTIONS} from '../../modules/dialog/actions'
import {foldersActions} from '../../modules/folders'
import type {FolderActions, FolderItem} from '../../types'

type Props = {
  actions?: FolderActions[]
  depth?: number
  folder: FolderItem
  hasChildren?: boolean
  isActive?: boolean
  isExpanded?: boolean
}

const FolderContainer = styled(Flex)<{$isActive?: boolean}>`
  height: 25px;
  cursor: pointer;
  background-color: ${props => (props.$isActive ? 'var(--card-bg-color)' : 'transparent')};
  &:hover {
    background-color: var(--card-bg-color);
  }
`

const ButtonContainer = styled(Flex)`
  @media (pointer: fine) {
    visibility: hidden;
  }

  @media (hover: hover) and (pointer: fine) {
    ${FolderContainer}:hover & {
      visibility: visible;
    }
  }
`

type FolderButtonProps = {
  disabled?: boolean
  icon: ReactNode
  onClick: (e: MouseEvent) => void
  tone?: 'critical' | 'primary'
  tooltip: string
}

const FolderButton = (props: FolderButtonProps) => {
  const {disabled, icon, onClick, tone, tooltip} = props

  return (
    <Tooltip
      animate
      content={
        <Container padding={2} width={0}>
          <Text muted size={1}>
            {tooltip}
          </Text>
        </Container>
      }
      disabled={'ontouchstart' in window}
      placement="top"
      portal
    >
      <Button
        disabled={disabled}
        fontSize={1}
        icon={icon}
        mode="bleed"
        onClick={onClick}
        padding={2}
        tone={tone}
      />
    </Tooltip>
  )
}

const Folder = (props: Props) => {
  const {actions, depth, folder, hasChildren = false, isActive = false, isExpanded = false} = props

  // Redux
  const dispatch = useDispatch()

  // Toggle folder expansion
  const handleToggleExpand = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation() // Prevent navigation when clicking chevron
      if (folder.folder._id) {
        dispatch(foldersActions.toggleFolderExpanded({folderId: folder.folder._id}))
      }
    },
    [dispatch, folder.folder._id]
  )

  // Navigate into folder
  const handleNavigate = useCallback(() => {
    if (!folder.updating) {
      dispatch(foldersActions.navigateToFolder({folderId: folder.folder._id}))
    }
  }, [dispatch, folder.folder._id, folder.updating])

  // Edit folder (rename)
  const handleShowFolderEditDialog = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation() // Prevent navigation when clicking edit
      if (folder.folder._id) {
        dispatch(DIALOG_ACTIONS.showFolderEdit({folderId: folder.folder._id}))
      }
    },
    [dispatch, folder.folder._id]
  )

  // Delete folder
  const handleShowFolderDeleteDialog = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation() // Prevent navigation when clicking delete
      dispatch(dialogActions.showConfirmDeleteFolder({folder: folder.folder}))
    },
    [dispatch, folder.folder]
  )

  return (
    <FolderContainer
      $isActive={isActive}
      align="center"
      flex={1}
      justify="space-between"
      onClick={handleNavigate}
      paddingY={1}
      style={{
        paddingLeft: depth === undefined ? '10px' : `${depth * 12 + 10}px`
      }}
    >
      <Flex align="center" flex={1} gap={1}>
        {/* Chevron for expand/collapse */}
        {depth !== undefined && (
          <Box
            onClick={hasChildren ? handleToggleExpand : undefined}
            style={{
              cursor: hasChildren ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              width: '12px',
              height: '12px',
              flexShrink: 0
            }}
          >
            {hasChildren && (
              <Text size={0} width={24}>
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </Text>
            )}
          </Box>
        )}
        <Text
          muted
          size={1}
          style={{
            fontWeight: isActive ? 'bold' : 'normal',
            opacity: folder?.updating ? 0.5 : 1.0,
            userSelect: 'none'
          }}
          textOverflow="ellipsis"
        >
          {folder?.folder?.name?.current}
        </Text>
      </Flex>

      <ButtonContainer align="center" style={{flexShrink: 0}}>
        {/* Navigate icon (always visible on mobile) */}
        {actions?.includes('navigate') && (
          <Box display={['block', 'block', 'none']}>
            <FolderButton
              disabled={folder?.updating}
              icon={<ChevronRightIcon />}
              onClick={e => {
                e.stopPropagation()
                handleNavigate()
              }}
              tooltip="Open folder"
            />
          </Box>
        )}

        {/* Edit icon */}
        {actions?.includes('edit') && (
          <FolderButton
            disabled={folder?.updating}
            icon={<EditIcon />}
            onClick={handleShowFolderEditDialog}
            tone="primary"
            tooltip="Rename folder"
          />
        )}

        {/* Delete icon */}
        {actions?.includes('delete') && (
          <FolderButton
            disabled={folder?.updating}
            icon={<TrashIcon />}
            onClick={handleShowFolderDeleteDialog}
            tone="critical"
            tooltip="Delete folder"
          />
        )}
      </ButtonContainer>
    </FolderContainer>
  )
}

export default Folder
