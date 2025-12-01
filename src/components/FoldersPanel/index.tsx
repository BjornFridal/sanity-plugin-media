import {Box} from '@sanity/ui'
import {FOLDERS_PANEL_WIDTH} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import FolderView from '../FolderView'

const FoldersPanel = () => {
  const foldersPanelVisible = useTypedSelector(state => state.folders.panelVisible)

  if (!foldersPanelVisible) {
    return null
  }

  return (
    <Box
      style={{
        position: 'relative',
        width: FOLDERS_PANEL_WIDTH
      }}
    >
      <Box
        className="media__custom-scrollbar"
        style={{
          borderRight: '1px solid var(--card-border-color)',
          height: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%'
        }}
      >
        <FolderView />
      </Box>
    </Box>
  )
}

export default FoldersPanel
