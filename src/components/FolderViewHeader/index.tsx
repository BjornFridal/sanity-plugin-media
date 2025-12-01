import {ComposeIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Label} from '@sanity/ui'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'
import {PANEL_HEIGHT} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {DIALOG_ACTIONS} from '../../modules/dialog/actions'
import {selectCurrentFolderId} from '../../modules/folders'
import {getSchemeColor} from '../../utils/getSchemeColor'

type Props = {
  allowCreate?: boolean
  light?: boolean
  title: string
}

const FolderViewHeader = ({allowCreate, light, title}: Props) => {
  const scheme = useColorSchemeValue()

  const dispatch = useDispatch()
  const foldersCreating = useTypedSelector(state => state.folders.creating)
  const foldersFetching = useTypedSelector(state => state.folders.fetching)
  const currentFolderId = useTypedSelector(selectCurrentFolderId)

  const handleFolderCreate = () => {
    dispatch(
      DIALOG_ACTIONS.showFolderCreate({
        parentId: currentFolderId || undefined
      })
    )
  }

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        paddingLeft={3}
        style={{
          background: light ? getSchemeColor(scheme, 'bg') : 'inherit',
          borderBottom: '1px solid var(--card-border-color)',
          flexShrink: 0,
          height: `${PANEL_HEIGHT}px`
        }}
      >
        <Inline space={2}>
          <Label size={0}>{title}</Label>
          {foldersFetching && (
            <Label size={0} style={{opacity: 0.3}}>
              Loading...
            </Label>
          )}
        </Inline>
        {/* Create new folder button */}
        {allowCreate && (
          <Box marginRight={1}>
            <Button
              disabled={foldersCreating}
              fontSize={1}
              icon={ComposeIcon}
              mode="bleed"
              onClick={handleFolderCreate}
              style={{
                background: 'transparent',
                boxShadow: 'none'
              }}
            />
          </Box>
        )}
      </Flex>
    </>
  )
}

export default FolderViewHeader
