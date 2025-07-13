import Link from 'next/link'
import { getSafeHref } from '@/utils/linkHelpers'

export function SafeLink({ href, children, fallback = '#', ...props }) {
  const safeHref = getSafeHref(href, fallback)
  
  if (safeHref === '#' || safeHref === fallback) {
    // Render as a disabled span instead of a link
    return (
      <span className="text-gray-400 cursor-not-allowed" {...props}>
        {children}
      </span>
    )
  }
  
  return (
    <Link href={safeHref} {...props}>
      {children}
    </Link>
  )
}

export default SafeLink

// Usage examples:

// Instead of:
// <Link href={`/admin/orders/${order._id}`}>View Order</Link>

// Use:
// <SafeLink href={getAdminOrderLink(order)}>View Order</SafeLink>

// Or:
// <Link href={getAdminOrderLink(order)}>View Order</Link>