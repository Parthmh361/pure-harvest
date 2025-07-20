// Example test route
export async function POST(request) {
  const user = await requireAuth(request)
  await NotificationService.create({
    recipientId: user.id,
    type: 'test',
    title: 'Test Notification',
    message: 'This is a test notification.',
    data: {},
    channels: { inApp: true }
  })
  return NextResponse.json({ success: true })
}