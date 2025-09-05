import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useTheme } from 'react-native-paper';
import { EducationScreen } from '../../src/screens/Education/EducationScreen';
import { CommunityLearningScreen } from '../../src/screens/Learn/CommunityLearningScreen';
import { CompetitionPrepScreen } from '../../src/screens/Learn/CompetitionPrepScreen';
import { SwipeToHome } from '../../components/SwipeToHome';

const renderScene = SceneMap({
  courses: EducationScreen,
  community: CommunityLearningScreen,
  prep: CompetitionPrepScreen,
});

export default function LearnTab() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'courses', title: 'Courses' },
    { key: 'community', title: 'Community' },
    { key: 'prep', title: 'Competition Prep' },
  ]);

  return (
    <SwipeToHome>
      <View style={styles.container}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: theme.colors.primary }}
              style={{ backgroundColor: theme.colors.surface }}
              labelStyle={{ color: theme.colors.onSurface }}
            />
          )}
        />
      </View>
    </SwipeToHome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
});
