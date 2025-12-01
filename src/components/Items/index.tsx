import {Box, Text} from '@sanity/ui'
import {useEffect} from 'react'
import {useDispatch} from 'react-redux'
import useBreakpointIndex from '../../hooks/useBreakpointIndex'
import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions} from '../../modules/assets'
import {selectCurrentFolder} from '../../modules/folders'
import {selectCombinedItems} from '../../modules/selectors'
import {tagsActions} from '../../modules/tags'
import AssetGridVirtualized from '../AssetGridVirtualized'
import AssetTableVirtualized from '../AssetTableVirtualized'

const Items = () => {
  // Redux
  const dispatch = useDispatch()
  const fetchCount = useTypedSelector(state => state.assets.fetchCount)
  const fetching = useTypedSelector(state => state.assets.fetching)
  const tagsPanelVisible = useTypedSelector(state => state.tags.panelVisible)
  const view = useTypedSelector(state => state.assets.view)
  const combinedItems = useTypedSelector(selectCombinedItems)

  const breakpointIndex = useBreakpointIndex()

  const hasFetchedOnce = fetchCount >= 0
  const hasItems = combinedItems.length > 0

  // Only load 1 page of items at a time.
  const handleLoadMoreItems = () => {
    if (!fetching) {
      dispatch(assetsActions.loadNextPage())
    }
  }

  // Effects

  // - Hide tag panel on smaller breakpoints
  useEffect(() => {
    if (breakpointIndex <= 1 && tagsPanelVisible) {
      dispatch(tagsActions.panelVisibleSet({panelVisible: false}))
    }
  }, [breakpointIndex])

  const currentFolder = useTypedSelector(selectCurrentFolder)
  const searchQuery = useTypedSelector(state => state.search.query)

  const isEmpty = !hasItems && hasFetchedOnce && !fetching

  const emptyText = searchQuery
    ? 'Your search gave no results.'
    : `The ${
        currentFolder?.folder?.name?.current ? `"${currentFolder.folder.name.current}"` : 'Root'
      } folder is empty.`

  return (
    <Box flex={1} style={{width: '100%'}}>
      {isEmpty ? (
        <Box padding={4}>
          <Text size={1} weight="semibold">
            {emptyText}
          </Text>
        </Box>
      ) : (
        <>
          {view === 'grid' && (
            <AssetGridVirtualized items={combinedItems} onLoadMore={handleLoadMoreItems} />
          )}

          {view === 'table' && (
            <AssetTableVirtualized items={combinedItems} onLoadMore={handleLoadMoreItems} />
          )}
        </>
      )}
    </Box>
  )
}

export default Items
