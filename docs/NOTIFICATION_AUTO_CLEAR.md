# Notification Auto-Clear Feature

## Overview

The notification system now automatically clears notification badges when users view their notifications or messages. This provides a seamless user experience where the red badges disappear once the user has seen the content.

## Features Implemented

### ✅ **Auto-Clear Notifications**
When users visit `/dashboard/notifications`:
- Unread notifications are automatically marked as read after **2 seconds**
- The red notification badge in the header clears automatically
- User sees unread count badge on the page header
- Visual indicator (blue dot) shows unread status before clearing

### ✅ **Auto-Clear Messages**
When users view a conversation in `/dashboard/messages`:
- Unread messages are automatically marked as read after **1 second**
- The blue message badge in the header clears automatically
- Only messages in the currently viewed conversation are marked as read

### ✅ **Manual Mark All as Read**
- **"Mark all as read" button** appears when there are unread notifications
- Instantly clears all notifications without delay
- Shows success toast confirmation
- Button includes loading state during operation

## User Experience Flow

### Notifications

1. **User receives notification** → Red badge appears in header with count
2. **User clicks notification icon** → Navigates to notifications page
3. **User sees notifications** → Page shows unread count and content
4. **After 2 seconds** → All notifications automatically marked as read
5. **Badge clears** → Red badge disappears from header
6. **Visual feedback** → Blue indicators removed from notification cards

### Messages

1. **User receives message** → Blue badge appears in header with count
2. **User clicks message icon** → Navigates to messages page
3. **User selects conversation** → Messages load in chat view
4. **After 1 second** → Unread messages marked as read
5. **Badge clears** → Blue badge disappears from header

## Technical Implementation

### Notifications Page (`src/app/dashboard/notifications/page.tsx`)

```typescript
// Auto-mark notifications as read
useEffect(() => {
  if (!user || !firestore || !notifications || !isClient) return;
  
  const unreadNotifications = notifications.filter(n => !n.read && n.id);
  if (unreadNotifications.length > 0) {
    const timer = setTimeout(async () => {
      await markAllNotificationsAsRead(firestore, user.uid, notifications);
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }
}, [notifications, user, firestore, isClient]);

// Manual mark all as read
const handleMarkAllAsRead = async () => {
  await markAllNotificationsAsRead(firestore, user.uid, notifications);
  toast({ title: 'All notifications marked as read' });
};
```

### Messages Page (`src/app/dashboard/messages/page.tsx`)

```typescript
// Auto-mark messages as read
useEffect(() => {
  if (!user || !firestore || !selectedConversation) return;

  const unreadMessages = filteredMessages.filter(
    msg => msg.receiverId === user.uid && !msg.read && msg.id
  );

  if (unreadMessages.length > 0) {
    const timer = setTimeout(async () => {
      const updatePromises = unreadMessages.map(async (msg) => {
        const messageRef = doc(firestore, 'users', user.uid, 'messages', msg.id);
        await setDocumentNonBlocking(messageRef, { read: true }, { merge: true });
      });
      await Promise.all(updatePromises);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }
}, [filteredMessages, selectedConversation, user, firestore]);
```

### Header Badge Display (`src/components/layout/site-header.tsx`)

```typescript
// Notification badge
<Button variant="ghost" size="icon" className="relative">
  <Bell className="h-5 w-5" />
  {unreadNotifications > 0 && (
    <Badge className="absolute -top-1 -right-1 bg-red-600">
      {unreadNotifications > 99 ? '99+' : unreadNotifications}
    </Badge>
  )}
</Button>

// Message badge
<Button variant="ghost" size="icon" className="relative">
  <MessageSquare className="h-5 w-5" />
  {unreadMessages > 0 && (
    <Badge className="absolute -top-1 -right-1 bg-blue-600">
      {unreadMessages > 99 ? '99+' : unreadMessages}
    </Badge>
  )}
</Button>
```

## Why Delayed Clearing?

### **Notifications: 2 Second Delay**
- Gives users time to see what notifications arrived
- Prevents accidental clearing if user navigates away quickly
- Allows users to identify new vs old notifications

### **Messages: 1 Second Delay**
- Shorter delay since messages are in context
- User is actively viewing the conversation
- Faster feedback for active conversations

## Visual Indicators

### Before Reading
- **Red badge** with count on Bell icon (notifications)
- **Blue badge** with count on MessageSquare icon (messages)
- **Blue left border** on unread notification cards
- **Blue dot** indicator next to unread notification title

### After Reading
- Badges disappear automatically
- Blue borders and dots removed
- Clean, clear interface

## Benefits

### For Users
- ✅ No manual clearing needed
- ✅ Clear visual feedback
- ✅ Reduces notification fatigue
- ✅ Seamless experience
- ✅ Manual control still available

### For Platform
- ✅ Encourages users to check notifications
- ✅ Reduces confusion about unread counts
- ✅ Better engagement metrics
- ✅ Professional user experience
- ✅ Follows modern app patterns (like Gmail, Slack, etc.)

## Configuration

### Adjust Timing
To change the auto-clear delay:

**Notifications:**
```typescript
// In src/app/dashboard/notifications/page.tsx
setTimeout(async () => {
  // ...
}, 2000); // Change this value (milliseconds)
```

**Messages:**
```typescript
// In src/app/dashboard/messages/page.tsx
setTimeout(async () => {
  // ...
}, 1000); // Change this value (milliseconds)
```

### Disable Auto-Clear
To disable automatic clearing and only use manual clearing:

**Notifications:**
```typescript
// Comment out or remove the useEffect hook that calls markAllNotificationsAsRead
// Keep only the handleMarkAllAsRead function
```

**Messages:**
```typescript
// Comment out or remove the useEffect hook that marks messages as read
```

## Database Structure

### Notification Document
```typescript
{
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'new_job_posted' | 'application' | 'new_message' | ...;
  read: boolean;  // ← Automatically updated to true
  timestamp: Timestamp;
  data?: {
    jobId?: string;
    conversationId?: string;
    // ... other data
  };
}
```

### Message Document
```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;  // ← Automatically updated to true
  status: 'sent' | 'delivered' | 'read';
}
```

## Testing

### Test Notification Clearing
1. Create a test notification (apply to a job or post something)
2. Check header - should show red badge with count
3. Navigate to `/dashboard/notifications`
4. Wait 2 seconds
5. Check header - badge should disappear
6. Refresh page - badge should not reappear

### Test Message Clearing
1. Send a message to yourself or another user
2. Check header - should show blue badge with count
3. Navigate to `/dashboard/messages`
4. Select the conversation
5. Wait 1 second
6. Check header - badge should disappear

### Test Manual Clearing
1. Navigate to `/dashboard/notifications` with unread notifications
2. Click "Mark all as read" button
3. Badge should clear immediately
4. Toast should appear confirming action

## Troubleshooting

### Badge Not Clearing

**Issue**: Badge still shows after viewing notifications

**Solutions**:
- Check browser console for errors
- Verify Firestore rules allow updating `read` field
- Ensure user is authenticated
- Check network tab for failed requests

### Premature Clearing

**Issue**: Notifications/messages marked as read too quickly

**Solution**: Increase delay timeout value

### Delayed Clearing

**Issue**: Takes too long to clear badges

**Solution**: Decrease delay timeout value or use manual clearing

## Future Enhancements

- [ ] Add user preference for auto-clear timing
- [ ] Option to disable auto-clear completely
- [ ] Notification grouping by type
- [ ] Batch notification clearing
- [ ] Desktop notifications integration
- [ ] Email digest for unread notifications
- [ ] Mark individual notifications as read on click
- [ ] Undo mark as read functionality

## Related Files

- `src/app/dashboard/notifications/page.tsx` - Notifications page with auto-clear
- `src/app/dashboard/messages/page.tsx` - Messages page with auto-clear
- `src/components/layout/site-header.tsx` - Header with badge display
- `src/lib/notifications.ts` - Notification helper functions
- `src/lib/types.ts` - Type definitions for Notification and Message

## API Functions

### Mark Single Notification as Read
```typescript
await markNotificationAsRead(firestore, userId, notificationId);
```

### Mark All Notifications as Read
```typescript
await markAllNotificationsAsRead(firestore, userId, notifications);
```

### Mark Message as Read
```typescript
const messageRef = doc(firestore, 'users', userId, 'messages', messageId);
await setDocumentNonBlocking(messageRef, { read: true }, { merge: true });
```

## Best Practices

1. **Always use delays** - Don't mark as read instantly
2. **Cleanup timers** - Return cleanup function from useEffect
3. **Check user context** - Verify user is authenticated
4. **Handle errors gracefully** - Don't break UI if marking fails
5. **Provide manual option** - Keep "Mark all as read" button
6. **Visual feedback** - Show loading states and confirmations
7. **Optimize queries** - Only fetch necessary data
8. **Filter properly** - Only mark messages from viewed conversation

## Summary

The auto-clear notification feature provides a modern, user-friendly experience that reduces manual work and keeps the interface clean. Notifications and messages are automatically marked as read after a short delay, giving users time to review content while ensuring badges clear automatically.
