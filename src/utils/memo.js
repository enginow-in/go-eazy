import React from 'react'

export const withMemo = (Component, areEqual) => {
  const MemoizedComponent = React.memo(Component, areEqual)
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`
  return MemoizedComponent
}

export const arePropsEqual = (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
}

export const areShallowEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)
  if (prevKeys.length !== nextKeys.length) return false
  return prevKeys.every(key => prevProps[key] === nextProps[key])
}
