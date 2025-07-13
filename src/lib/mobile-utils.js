// Mobile-specific utility functions

export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

export const isDesktop = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024
}

export const getViewportSize = () => {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 480) return 'xs'
  if (width < 640) return 'sm'
  if (width < 768) return 'md'
  if (width < 1024) return 'lg'
  return 'xl'
}

export const addMobileListeners = (callback) => {
  if (typeof window === 'undefined') return () => {}
  
  const events = ['resize', 'orientationchange']
  
  events.forEach(event => {
    window.addEventListener(event, callback, { passive: true })
  })
  
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, callback)
    })
  }
}

// Touch gesture helpers
export const addTouchSupport = (element, options = {}) => {
  if (!element || typeof window === 'undefined') return
  
  let startX = 0
  let startY = 0
  let distX = 0
  let distY = 0
  
  const threshold = options.threshold || 50
  const restraint = options.restraint || 100
  const allowedTime = options.allowedTime || 300
  
  let startTime = 0
  
  element.addEventListener('touchstart', (e) => {
    const touchobj = e.changedTouches[0]
    startX = touchobj.pageX
    startY = touchobj.pageY
    startTime = new Date().getTime()
  }, { passive: true })
  
  element.addEventListener('touchend', (e) => {
    const touchobj = e.changedTouches[0]
    distX = touchobj.pageX - startX
    distY = touchobj.pageY - startY
    const elapsedTime = new Date().getTime() - startTime
    
    if (elapsedTime <= allowedTime) {
      if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
        const direction = distX < 0 ? 'left' : 'right'
        options.onSwipe?.(direction, { distX, distY, elapsedTime })
      }
    }
  }, { passive: true })
}

// Intersection Observer for mobile performance
export const createMobileObserver = (callback, options = {}) => {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return { observe: () => {}, disconnect: () => {} }
  }
  
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver(callback, defaultOptions)
}