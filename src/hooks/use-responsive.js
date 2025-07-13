"use client"

import { useState, useEffect } from 'react'

const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  })
  
  const [breakpoint, setBreakpoint] = useState('lg')

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })
      
      if (width < breakpoints.xs) {
        setBreakpoint('xs')
      } else if (width < breakpoints.sm) {
        setBreakpoint('sm')
      } else if (width < breakpoints.md) {
        setBreakpoint('md')
      } else if (width < breakpoints.lg) {
        setBreakpoint('lg')
      } else if (width < breakpoints.xl) {
        setBreakpoint('xl')
      } else {
        setBreakpoint('2xl')
      }
    }

    // Set initial size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    windowSize,
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md' || breakpoint === 'lg',
    isDesktop: breakpoint === 'xl' || breakpoint === '2xl',
    isSmallScreen: breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md'
  }
}

export function useBreakpoint(targetBreakpoint) {
  const { breakpoint } = useResponsive()
  
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpointOrder.indexOf(breakpoint)
  const targetIndex = breakpointOrder.indexOf(targetBreakpoint)
  
  return {
    isExact: breakpoint === targetBreakpoint,
    isAbove: currentIndex > targetIndex,
    isBelow: currentIndex < targetIndex,
    isAtLeast: currentIndex >= targetIndex,
    isAtMost: currentIndex <= targetIndex
  }
}