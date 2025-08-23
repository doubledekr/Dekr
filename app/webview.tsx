import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text as RNText, Platform } from 'react-native';
import { useTheme, IconButton, Text } from 'react-native-paper';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import WebView, { WebViewProps } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Basic custom user agent
const USER_AGENT = Platform.select({
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
  default: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
});

// Base wrapper template for loading HTML content
const HTML_WRAPPER = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        padding: 20px;
        margin: 0;
        line-height: 1.6;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      a {
        color: #2196F3;
        text-decoration: none;
      }
      h1, h2, h3, h4 {
        margin-top: 1.5em;
        margin-bottom: 0.75em;
      }
      p {
        margin-bottom: 1.5em;
      }
      iframe {
        border: none;
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="content">__CONTENT__</div>
    <script>
      // Prevent redirects and popups
      window.onbeforeunload = function() {
        return "";
      };
      // Block popups
      window.open = function() { 
        console.log("Popup blocked");
        return null; 
      };
      // Block redirects
      Object.defineProperty(window, 'location', {
        writable: false
      });
    </script>
  </body>
</html>
`;

// Function to decode HTML entities
function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&#x2F;|&#x60;|&#x3D;/g, (match: string) => entities[match]);
}

export default function WebViewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { url: encodedUrl, title: encodedTitle } = useLocalSearchParams<{ url: string; title: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const initialLoadRef = useRef(true);

  // Decode parameters
  let decodedUrl = '';
  let decodedTitle = '';
  
  try {
    decodedUrl = encodedUrl ? decodeURIComponent(encodedUrl) : '';
    decodedTitle = encodedTitle ? decodeHTMLEntities(decodeURIComponent(encodedTitle)) : 'Article';
  } catch (err) {
    console.error('Error decoding parameters:', err);
  }

  const handleBack = () => {
    Haptics.selectionAsync();
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      router.back();
    }
  };

  const handleReload = () => {
    if (webViewRef.current) {
      setIsLoading(true);
      webViewRef.current.reload();
    }
  };

  // Sites that need iframe wrapper to prevent reloads/popups
  // Extended list of problematic news sites
  const useIframeWrapper = [
    'bloomberg.com', 
    'wsj.com', 
    'ft.com', 
    'investing.com', 
    'cnbc.com', 
    'reuters.com',
    'marketwatch.com',
    'barrons.com',
    'finance.yahoo.com'
  ].some(domain => decodedUrl.includes(domain));

  // Create a simple iframe wrapper that prevents refreshes
  const htmlContent = useIframeWrapper 
    ? HTML_WRAPPER.replace('__CONTENT__', 
        `<iframe 
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups" 
          src="${decodedUrl}"
          style="border: none; width: 100%; height: 100vh; overflow: auto;"
        ></iframe>
        <script>
          // Additional script to prevent automatic reloads
          document.addEventListener('DOMContentLoaded', function() {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              try {
                // Try to prevent location changes in the iframe
                iframe.contentWindow.addEventListener('beforeunload', function(e) {
                  e.preventDefault();
                  e.returnValue = '';
                  return '';
                });
              } catch (e) {
                console.log('Could not add beforeunload listener to iframe');
              }
            }
          });
        </script>`)
    : '';

  if (!decodedUrl) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }, styles.loadingContainer]}>
        <RNText style={{ marginBottom: 20 }}>No URL provided</RNText>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.navButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }, styles.loadingContainer]}>
        <RNText style={{ color: theme.colors.error, marginBottom: 20 }}>{error}</RNText>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.navButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: decodedTitle,
          headerLeft: () => (
            <IconButton
              icon="close"
              size={24}
              onPress={() => router.back()}
            />
          ),
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
        }}
      />

      <WebView 
        ref={webViewRef}
        source={useIframeWrapper ? { html: htmlContent, baseUrl: decodedUrl } : { uri: decodedUrl }}
        style={styles.webview}
        userAgent={USER_AGENT}
        startInLoadingState={true}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onError={(event) => {
          setError(`Failed to load: ${event.nativeEvent.description}`);
          setIsLoading(false);
          initialLoadRef.current = false;
        }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsFullscreenVideo={true}
        pullToRefreshEnabled={false}
        allowsBackForwardNavigationGestures={true}
        cacheEnabled={true}
        cacheMode={'LOAD_CACHE_ELSE_NETWORK' as any}
        // Add this prop to prevent refreshing on Android
        overScrollMode={'never' as any}
        // Disable reload for problematic sites that keep refreshing
        incognito={useIframeWrapper}
        onShouldStartLoadWithRequest={(request) => {
          // Prevent iframe from navigating to new domains
          if (useIframeWrapper && request.url !== decodedUrl && !request.url.startsWith('about:')) {
            // Allow same domain navigation
            try {
              const decodedDomain = new URL(decodedUrl).hostname;
              const requestDomain = new URL(request.url).hostname;
              return decodedDomain === requestDomain;
            } catch (e) {
              console.error('URL parsing error:', e);
              return true;
            }
          }
          return true;
        }}
      />
      
      <View style={[styles.navBar, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleBack}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.colors.secondary, marginLeft: 12 }]} 
          onPress={handleReload}
        >
          <Text style={styles.navButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    maxWidth: 160,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 