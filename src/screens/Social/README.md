# Friend System & Sharing Feature

A comprehensive social system that enables users to connect with friends and share decks/cards through dynamic links and share codes.

## Overview

The friend system and sharing functionality consists of:

1. **FriendsScreen** - Complete friend management interface
2. **ShareCodeScreen** - Manual share code entry
3. **Cloud Functions** - Server-side friend requests and sharing logic
4. **Hooks** - Client-side state management and API integration
5. **Deep Linking** - Firebase Dynamic Links with fallback to manual codes

## Features

### 👥 **Friend System**

#### **Friend Management**
- **Send Friend Requests**: Search users by name/email and send requests
- **Accept/Decline Requests**: Manage incoming friend requests with notifications
- **Symmetric Relationships**: Maintains bidirectional friendship edges
- **Mutual Friends**: Calculate and display mutual friend counts
- **Friend Discovery**: Search and find users by display name or email

#### **User Interface**
- **Tabbed Interface**: Requests, My Friends, and Find tabs
- **Real-time Updates**: Live friend request notifications with badges
- **Search Functionality**: Find users with autocomplete suggestions
- **Profile Integration**: View friend profiles and activity

### 🔗 **Sharing System**

#### **Share Link Generation**
- **Dynamic Links**: Firebase Dynamic Links for seamless app integration
- **Fallback Codes**: Manual 12-character codes for when links fail
- **Permission Levels**: View-only or edit access for shared content
- **Expiration**: Configurable expiration dates (7-30 days)

#### **Share Methods**
- **System Share**: Native iOS/Android share sheet integration
- **Copy to Clipboard**: Direct link copying with user feedback
- **Share Codes**: Manual code sharing for offline scenarios
- **Deep Linking**: Automatic navigation to shared content

#### **Content Types**
- **Deck Sharing**: Share entire investment decks with friends
- **Card Sharing**: Share individual asset cards and analysis
- **Permission Control**: Granular access control (view vs edit)

## Technical Implementation

### **Cloud Functions** (`functions/src/social.ts`)

#### **`sendFriendRequest(fromUid, toUid)`**
- Validates user existence and prevents duplicate requests
- Creates friend request document with pending status
- Includes mutual friend count calculation
- Returns success confirmation with request ID

#### **`acceptFriendRequest(requestId)`**
- Verifies request ownership and pending status
- Creates symmetric friendship edges atomically
- Updates user follower/following counts
- Maintains data consistency with batch operations

#### **`createShareLink({type, targetId, permission})`**
- Validates user permissions for target content
- Generates unique 12-character share codes
- Creates Firebase Dynamic Links with fallbacks
- Supports configurable expiration dates
- Tracks access logs and view counts

#### **`accessShareLink(linkCode)`**
- Validates and processes share codes
- Checks expiration and active status
- Logs access attempts with user tracking
- Returns target content data for navigation

### **Frontend Hooks**

#### **Friend Management** (`src/hooks/useFriends.ts`)
- **`useFriendRequests()`**: Real-time incoming request monitoring
- **`useMyFriends()`**: Friend list with profile data
- **`useSearchUsers()`**: User search with filtering
- **`useSendFriendRequest()`**: Send requests with validation
- **`useRespondToFriendRequest()`**: Accept/decline with UI feedback

#### **Sharing System** (`src/hooks/useSharing.ts`)
- **`useCreateShareLink()`**: Generate share links with options
- **`useAccessShareLink()`**: Process incoming share codes
- **`useShareActions()`**: System integration and clipboard
- **`useDeepLinkHandler()`**: Handle incoming deep links
- **`useShareCodeInput()`**: Manual code entry processing

### **User Interface Components**

#### **FriendsScreen** (`src/screens/Social/FriendsScreen.tsx`)
```typescript
interface FriendsScreen {
  tabs: ['requests', 'friends', 'find'];
  features: {
    realTimeRequests: boolean;
    userSearch: boolean;
    profileViewing: boolean;
    shareCodeAccess: boolean;
  };
}
```

#### **ShareCodeScreen** (`src/screens/Social/ShareCodeScreen.tsx`)
```typescript
interface ShareCodeScreen {
  input: {
    validation: boolean;
    pasteSupport: boolean;
    guidanceText: boolean;
  };
  processing: {
    codeValidation: boolean;
    navigationHandling: boolean;
    errorFeedback: boolean;
  };
}
```

## Security & Privacy

### **Firestore Security Rules**
- **Friend Requests**: Only request recipients can accept/decline
- **User Search**: Respects public/private profile settings
- **Share Access**: Validates permissions before content access
- **Data Isolation**: Users can only modify their own relationships

### **Data Protection**
- **Symmetric Edges**: Maintains consistent friendship state
- **Atomic Operations**: Prevents partial state updates
- **Access Logging**: Tracks share link usage for security
- **Expiration Handling**: Automatic cleanup of expired shares

## Usage Examples

### **Sending Friend Requests**
```typescript
const { sendFriendRequest } = useSendFriendRequest();

const handleSendRequest = async (userId: string) => {
  try {
    await sendFriendRequest(userId);
    Alert.alert('Success', 'Friend request sent!');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### **Creating Share Links**
```typescript
const { createShareLink } = useCreateShareLink();

const shareMyDeck = async (deckId: string) => {
  const result = await createShareLink({
    type: 'deck',
    targetId: deckId,
    permission: 'view',
    expiresIn: 30,
  });
  
  // Share via system
  Share.share({
    message: `Check out my deck!`,
    url: result.deepLink,
  });
};
```

### **Processing Share Codes**
```typescript
const { processShareCode } = useShareCodeInput();

const handleCodeEntry = async (code: string) => {
  const result = await processShareCode(code);
  if (result?.share.type === 'deck') {
    navigation.navigate('DeckDetail', { 
      deckId: result.share.targetId 
    });
  }
};
```

## Deep Linking Integration

### **URL Patterns**
- **Share Links**: `https://dekr.app/share/{linkCode}`
- **Dynamic Links**: `https://dekr.page.link/?link=...`
- **Fallback**: Manual code entry via ShareCodeScreen

### **Navigation Handling**
```typescript
const { handleDeepLink } = useDeepLinkHandler();

// Process incoming URLs
const result = await handleDeepLink(url);
if (result.type === 'deck') {
  navigation.navigate('DeckDetail', { deckId: result.targetId });
}
```

## Performance Optimizations

### **Efficient Queries**
- **Composite Indexes**: Optimized friend and share queries
- **Pagination**: Large friend lists load incrementally  
- **Real-time Listeners**: Selective onSnapshot subscriptions
- **Batch Operations**: Atomic multi-document updates

### **Caching Strategy**
- **Friend Lists**: Local state with periodic refresh
- **Share Links**: Temporary caching for repeated access
- **User Profiles**: Profile data caching with TTL
- **Search Results**: Debounced search with result caching

## Deployment Requirements

### **Cloud Functions**
```bash
# Deploy social functions
firebase deploy --only functions:sendFriendRequest,functions:acceptFriendRequest,functions:createShareLink,functions:accessShareLink
```

### **Firestore Indexes**
```json
{
  "indexes": [
    {
      "collectionGroup": "friends",
      "fields": [
        {"fieldPath": "toUserId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "requestedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "shares",
      "fields": [
        {"fieldPath": "linkCode", "order": "ASCENDING"},
        {"fieldPath": "isActive", "order": "ASCENDING"}
      ]
    }
  ]
}
```

### **Firebase Dynamic Links**
- Configure domain: `dekr.page.link`
- Set up iOS/Android app associations
- Configure fallback URLs for web

## Future Enhancements

### **Advanced Features**
- **Friend Groups**: Organize friends into custom groups
- **Activity Feed**: Social activity timeline
- **Collaborative Editing**: Real-time deck collaboration
- **Push Notifications**: Friend request and share notifications
- **QR Codes**: Visual share code generation
- **Bulk Sharing**: Share multiple items at once

### **Analytics Integration**
- **Share Tracking**: Monitor share link performance
- **Friend Network**: Analyze social graph metrics
- **Usage Patterns**: Track feature adoption
- **Conversion Rates**: Measure share-to-action rates

## Testing

### **Unit Tests**
- Friend request flow validation
- Share link generation and access
- Permission checking and validation
- Error handling and edge cases

### **Integration Tests**
- End-to-end friend request process
- Deep link navigation testing
- Multi-user sharing scenarios
- Cross-platform compatibility

## Troubleshooting

### **Common Issues**
- **Expired Links**: Check expiration dates and regenerate
- **Permission Denied**: Verify user permissions for shared content
- **Deep Link Failures**: Ensure proper URL scheme configuration
- **Friend Request Duplicates**: Cloud Function prevents duplicates

### **Debug Tools**
- Console logging for all sharing operations
- Error boundaries for graceful failure handling
- User feedback for all critical operations
- Admin tools for share link management
