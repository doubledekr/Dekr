import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          'AustinNewsDeck-Bold': require('../assets/fonts/Austin-News-Deck-Family/AustinNewsDeck-Bold-Trial.otf'),
          'AustinNewsDeck-Medium': require('../assets/fonts/Austin-News-Deck-Family/AustinNewsDeck-Medium-Trial.otf'),
          'AustinNewsDeck-Roman': require('../assets/fonts/Austin-News-Deck-Family/AustinNewsDeck-Roman-Trial.otf'),
          'Graphik-Bold': require('../assets/fonts/Graphik_Family/Graphik-Bold-Trial.otf'),
          'Graphik-Medium': require('../assets/fonts/Graphik_Family/Graphik-Medium-Trial.otf'),
          'Graphik-Regular': require('../assets/fonts/Graphik_Family/Graphik-Regular-Trial.otf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
} 