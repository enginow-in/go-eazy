import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  toggleCompare,
  removeFromCompare,
  clearCompare,
  setCompareModalOpen
} from '../store/compareSlice'
import { useProperties } from './useProperties'
import { MOCK_PROPERTIES } from '../utils/constants'

export const useCompare = () => {
  const dispatch = useDispatch()
  const { comparedIds, isModalOpen } = useSelector(s => s.compare || { comparedIds: [], isModalOpen: false })
  const { listings } = useProperties()

  // Merge dynamic properties with mock properties for complete resolution
  const allAvailableProperties = useMemo(() => {
    const map = new Map()
    if (Array.isArray(MOCK_PROPERTIES)) {
      MOCK_PROPERTIES.forEach(p => map.set(p.id, p))
    }
    if (Array.isArray(listings)) {
      listings.forEach(p => map.set(p.id, p))
    }
    return Array.from(map.values())
  }, [listings])

  const comparedProperties = useMemo(() => {
    return comparedIds
      .map(id => allAvailableProperties.find(p => p.id === id))
      .filter(Boolean)
  }, [comparedIds, allAvailableProperties])

  const handleToggle = (id) => dispatch(toggleCompare(id))
  const handleRemove = (id) => dispatch(removeFromCompare(id))
  const handleClear = () => dispatch(clearCompare())
  const handleOpen = () => dispatch(setCompareModalOpen(true))
  const handleClose = () => dispatch(setCompareModalOpen(false))

  const isCompared = (id) => comparedIds.includes(id)

  return {
    comparedIds,
    comparedProperties,
    isCompareModalOpen: isModalOpen,
    toggleCompare: handleToggle,
    removeFromCompare: handleRemove,
    clearCompare: handleClear,
    openCompareModal: handleOpen,
    closeCompareModal: handleClose,
    isCompared
  }
}
