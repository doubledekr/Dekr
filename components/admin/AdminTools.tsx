import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  SegmentedButtons,
  Chip,
  Icon,
  ActivityIndicator,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Competition } from '../../services/CompetitionService';
import { Challenge } from '../../services/ChallengeService';
import { Badge } from '../../services/RewardSystem';
import { competitionService } from '../../services/CompetitionService';
import { challengeService } from '../../services/ChallengeService';
import { rewardSystem } from '../../services/RewardSystem';
import { safeHapticImpact } from '../../utils/haptics';

interface AdminToolsProps {
  isAdmin?: boolean;
}

export const AdminTools: React.FC<AdminToolsProps> = ({ isAdmin = false }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'competitions' | 'challenges' | 'badges' | 'analytics'>('competitions');
  const [isLoading, setIsLoading] = useState(false);
  
  // Competition creation state
  const [newCompetition, setNewCompetition] = useState({
    title: '',
    description: '',
    type: 'binary' as Competition['type'],
    category: 'stocks' as Competition['category'],
    assets: [] as string[],
    options: [] as string[],
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxParticipants: 100,
    entryFee: 0,
    prizePool: 1000,
  });

  // Challenge creation state
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'portfolio' as Challenge['type'],
    category: 'tech' as Challenge['category'],
    theme: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    maxParticipants: 50,
    entryFee: 0,
    prizePool: 2000,
  });

  // Badge creation state
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    category: 'prediction' as Badge['category'],
    icon: 'medal',
    rarity: 'common' as Badge['rarity'],
    pointsReward: 100,
    requirements: {
      type: 'total' as const,
      value: 10,
      description: '',
    },
  });

  const [assetInput, setAssetInput] = useState('');
  const [optionInput, setOptionInput] = useState('');

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Card style={styles.accessDeniedCard}>
          <Card.Content>
            <Icon source="lock" size={48} color={theme.colors.error} />
            <Title style={styles.accessDeniedTitle}>Access Denied</Title>
            <Paragraph style={styles.accessDeniedText}>
              You don't have admin privileges to access this section.
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const handleCreateCompetition = async () => {
    if (!newCompetition.title || !newCompetition.description || newCompetition.assets.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    safeHapticImpact();

    try {
      const competitionData = {
        ...newCompetition,
        startDate: new Date(newCompetition.startDate),
        endDate: new Date(newCompetition.endDate),
        status: 'upcoming' as const,
        educationalContent: {
          title: `Learn about ${newCompetition.assets.join(', ')}`,
          description: `Educational content for ${newCompetition.title}`,
          resources: [],
        },
      };

      await competitionService.createCompetition(competitionData);
      
      Alert.alert('Success', 'Competition created successfully!');
      
      // Reset form
      setNewCompetition({
        title: '',
        description: '',
        type: 'binary',
        category: 'stocks',
        assets: [],
        options: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxParticipants: 100,
        entryFee: 0,
        prizePool: 1000,
      });
    } catch (error) {
      console.error('Error creating competition:', error);
      Alert.alert('Error', 'Failed to create competition');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!newChallenge.title || !newChallenge.description || !newChallenge.theme) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    safeHapticImpact();

    try {
      const challengeData = {
        ...newChallenge,
        startDate: new Date(newChallenge.startDate),
        endDate: new Date(newChallenge.endDate),
        status: 'upcoming' as const,
        rules: [
          'Follow all community guidelines',
          'No manipulation or cheating',
          'Respect other participants',
        ],
        requirements: {
          minPredictions: newChallenge.type === 'prediction' ? 5 : undefined,
          portfolioSize: newChallenge.type === 'portfolio' ? 5 : undefined,
          educationalModules: newChallenge.type === 'educational' ? ['module1', 'module2'] : undefined,
          socialInteractions: newChallenge.type === 'social' ? 10 : undefined,
        },
        educationalContent: {
          title: `Learn about ${newChallenge.theme}`,
          description: `Educational content for ${newChallenge.title}`,
          modules: ['module1', 'module2'],
          resources: [],
        },
      };

      await challengeService.createChallenge(challengeData);
      
      Alert.alert('Success', 'Challenge created successfully!');
      
      // Reset form
      setNewChallenge({
        title: '',
        description: '',
        type: 'portfolio',
        category: 'tech',
        theme: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxParticipants: 50,
        entryFee: 0,
        prizePool: 2000,
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBadge = async () => {
    if (!newBadge.name || !newBadge.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    safeHapticImpact();

    try {
      await rewardSystem.createBadge(newBadge);
      
      Alert.alert('Success', 'Badge created successfully!');
      
      // Reset form
      setNewBadge({
        name: '',
        description: '',
        category: 'prediction',
        icon: 'medal',
        rarity: 'common',
        pointsReward: 100,
        requirements: {
          type: 'total',
          value: 10,
          description: '',
        },
      });
    } catch (error) {
      console.error('Error creating badge:', error);
      Alert.alert('Error', 'Failed to create badge');
    } finally {
      setIsLoading(false);
    }
  };

  const addAsset = () => {
    if (assetInput.trim()) {
      setNewCompetition({
        ...newCompetition,
        assets: [...newCompetition.assets, assetInput.trim().toUpperCase()],
      });
      setAssetInput('');
    }
  };

  const removeAsset = (index: number) => {
    setNewCompetition({
      ...newCompetition,
      assets: newCompetition.assets.filter((_, i) => i !== index),
    });
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewCompetition({
        ...newCompetition,
        options: [...newCompetition.options, optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setNewCompetition({
      ...newCompetition,
      options: newCompetition.options.filter((_, i) => i !== index),
    });
  };

  const renderCompetitionForm = () => (
    <ScrollView style={styles.formContainer}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.formTitle}>Create New Competition</Title>
          
          <TextInput
            label="Competition Title"
            value={newCompetition.title}
            onChangeText={(text) => setNewCompetition({ ...newCompetition, title: text })}
            style={styles.input}
          />
          
          <TextInput
            label="Description"
            value={newCompetition.description}
            onChangeText={(text) => setNewCompetition({ ...newCompetition, description: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <View style={styles.segmentedContainer}>
            <Text style={styles.segmentedLabel}>Type</Text>
            <SegmentedButtons
              value={newCompetition.type}
              onValueChange={(value) => setNewCompetition({ ...newCompetition, type: value as Competition['type'] })}
              buttons={[
                { value: 'binary', label: 'Binary' },
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'numeric', label: 'Numeric' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.segmentedContainer}>
            <Text style={styles.segmentedLabel}>Category</Text>
            <SegmentedButtons
              value={newCompetition.category}
              onValueChange={(value) => setNewCompetition({ ...newCompetition, category: value as Competition['category'] })}
              buttons={[
                { value: 'stocks', label: 'Stocks' },
                { value: 'crypto', label: 'Crypto' },
                { value: 'mixed', label: 'Mixed' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.assetsContainer}>
            <Text style={styles.assetsLabel}>Assets</Text>
            <View style={styles.assetInputContainer}>
              <TextInput
                label="Add Asset Symbol"
                value={assetInput}
                onChangeText={setAssetInput}
                style={styles.assetInput}
                onSubmitEditing={addAsset}
              />
              <Button mode="contained" onPress={addAsset} style={styles.addButton}>
                Add
              </Button>
            </View>
            <View style={styles.assetsChips}>
              {newCompetition.assets.map((asset, index) => (
                <Chip
                  key={index}
                  onClose={() => removeAsset(index)}
                  style={styles.assetChip}
                >
                  {asset}
                </Chip>
              ))}
            </View>
          </View>
          
          {newCompetition.type === 'multiple_choice' && (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>Options</Text>
              <View style={styles.optionInputContainer}>
                <TextInput
                  label="Add Option"
                  value={optionInput}
                  onChangeText={setOptionInput}
                  style={styles.optionInput}
                  onSubmitEditing={addOption}
                />
                <Button mode="contained" onPress={addOption} style={styles.addButton}>
                  Add
                </Button>
              </View>
              <View style={styles.optionsChips}>
                {newCompetition.options.map((option, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeOption(index)}
                    style={styles.optionChip}
                  >
                    {option}
                  </Chip>
                ))}
              </View>
            </View>
          )}
          
          <TextInput
            label="Max Participants"
            value={newCompetition.maxParticipants.toString()}
            onChangeText={(text) => setNewCompetition({ ...newCompetition, maxParticipants: parseInt(text) || 100 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Entry Fee (Points)"
            value={newCompetition.entryFee.toString()}
            onChangeText={(text) => setNewCompetition({ ...newCompetition, entryFee: parseInt(text) || 0 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Prize Pool (Points)"
            value={newCompetition.prizePool.toString()}
            onChangeText={(text) => setNewCompetition({ ...newCompetition, prizePool: parseInt(text) || 1000 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleCreateCompetition}
            loading={isLoading}
            disabled={isLoading}
            style={styles.createButton}
          >
            Create Competition
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderChallengeForm = () => (
    <ScrollView style={styles.formContainer}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.formTitle}>Create New Challenge</Title>
          
          <TextInput
            label="Challenge Title"
            value={newChallenge.title}
            onChangeText={(text) => setNewChallenge({ ...newChallenge, title: text })}
            style={styles.input}
          />
          
          <TextInput
            label="Description"
            value={newChallenge.description}
            onChangeText={(text) => setNewChallenge({ ...newChallenge, description: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <TextInput
            label="Theme"
            value={newChallenge.theme}
            onChangeText={(text) => setNewChallenge({ ...newChallenge, theme: text })}
            style={styles.input}
          />
          
          <View style={styles.segmentedContainer}>
            <Text style={styles.segmentedLabel}>Type</Text>
            <SegmentedButtons
              value={newChallenge.type}
              onValueChange={(value) => setNewChallenge({ ...newChallenge, type: value as Challenge['type'] })}
              buttons={[
                { value: 'portfolio', label: 'Portfolio' },
                { value: 'prediction', label: 'Prediction' },
                { value: 'educational', label: 'Educational' },
                { value: 'social', label: 'Social' },
                { value: 'mixed', label: 'Mixed' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.segmentedContainer}>
            <Text style={styles.segmentedLabel}>Category</Text>
            <SegmentedButtons
              value={newChallenge.category}
              onValueChange={(value) => setNewChallenge({ ...newChallenge, category: value as Challenge['category'] })}
              buttons={[
                { value: 'tech', label: 'Tech' },
                { value: 'crypto', label: 'Crypto' },
                { value: 'esg', label: 'ESG' },
                { value: 'earnings', label: 'Earnings' },
                { value: 'general', label: 'General' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <TextInput
            label="Max Participants"
            value={newChallenge.maxParticipants.toString()}
            onChangeText={(text) => setNewChallenge({ ...newChallenge, maxParticipants: parseInt(text) || 50 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Entry Fee (Points)"
            value={newChallenge.entryFee.toString()}
            onChangeText={(text) => setNewChallenge({ ...newChallenge, entryFee: parseInt(text) || 0 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Prize Pool (Points)"
            value={newChallenge.prizePool.toString()}
            onChangeText={(text) => setNewChallenge({ ...newChallenge, prizePool: parseInt(text) || 2000 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleCreateChallenge}
            loading={isLoading}
            disabled={isLoading}
            style={styles.createButton}
          >
            Create Challenge
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderBadgeForm = () => (
    <ScrollView style={styles.formContainer}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.formTitle}>Create New Badge</Title>
          
          <TextInput
            label="Badge Name"
            value={newBadge.name}
            onChangeText={(text) => setNewBadge({ ...newBadge, name: text })}
            style={styles.input}
          />
          
          <TextInput
            label="Description"
            value={newBadge.description}
            onChangeText={(text) => setNewBadge({ ...newBadge, description: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <View style={styles.segmentedContainer}>
            <Text style={styles.segmentedLabel}>Category</Text>
            <SegmentedButtons
              value={newBadge.category}
              onValueChange={(value) => setNewBadge({ ...newBadge, category: value as Badge['category'] })}
              buttons={[
                { value: 'prediction', label: 'Prediction' },
                { value: 'social', label: 'Social' },
                { value: 'learning', label: 'Learning' },
                { value: 'performance', label: 'Performance' },
                { value: 'challenge', label: 'Challenge' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <View style={styles.segmentedContainer}>
            <Text style={styles.segmentedLabel}>Rarity</Text>
            <SegmentedButtons
              value={newBadge.rarity}
              onValueChange={(value) => setNewBadge({ ...newBadge, rarity: value as Badge['rarity'] })}
              buttons={[
                { value: 'common', label: 'Common' },
                { value: 'rare', label: 'Rare' },
                { value: 'epic', label: 'Epic' },
                { value: 'legendary', label: 'Legendary' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          <TextInput
            label="Icon Name (MaterialCommunityIcons)"
            value={newBadge.icon}
            onChangeText={(text) => setNewBadge({ ...newBadge, icon: text })}
            style={styles.input}
          />
          
          <TextInput
            label="Points Reward"
            value={newBadge.pointsReward.toString()}
            onChangeText={(text) => setNewBadge({ ...newBadge, pointsReward: parseInt(text) || 100 })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Requirement Description"
            value={newBadge.requirements.description}
            onChangeText={(text) => setNewBadge({ 
              ...newBadge, 
              requirements: { ...newBadge.requirements, description: text }
            })}
            style={styles.input}
          />
          
          <TextInput
            label="Requirement Value"
            value={newBadge.requirements.value.toString()}
            onChangeText={(text) => setNewBadge({ 
              ...newBadge, 
              requirements: { ...newBadge.requirements, value: parseInt(text) || 10 }
            })}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleCreateBadge}
            loading={isLoading}
            disabled={isLoading}
            style={styles.createButton}
          >
            Create Badge
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <Card style={styles.analyticsCard}>
        <Card.Content>
          <Title style={styles.analyticsTitle}>Platform Analytics</Title>
          <Text style={styles.analyticsText}>
            Analytics dashboard coming soon...
          </Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon source="cog" size={24} color={theme.colors.primary} />
        <Title style={styles.headerTitle}>Admin Tools</Title>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          buttons={[
            { value: 'competitions', label: 'Competitions', icon: 'trophy' },
            { value: 'challenges', label: 'Challenges', icon: 'medal' },
            { value: 'badges', label: 'Badges', icon: 'star' },
            { value: 'analytics', label: 'Analytics', icon: 'chart-line' },
          ]}
          style={styles.tabButtons}
        />
      </View>

      {/* Content */}
      {activeTab === 'competitions' && renderCompetitionForm()}
      {activeTab === 'challenges' && renderChallengeForm()}
      {activeTab === 'badges' && renderBadgeForm()}
      {activeTab === 'analytics' && renderAnalytics()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    marginLeft: 8,
    flex: 1,
  },
  tabContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButtons: {
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  segmentedContainer: {
    marginBottom: 16,
  },
  segmentedLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  assetsContainer: {
    marginBottom: 16,
  },
  assetsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  assetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    minWidth: 80,
  },
  assetsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  optionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    marginRight: 8,
  },
  optionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
  },
  analyticsContainer: {
    flex: 1,
    padding: 16,
  },
  analyticsCard: {
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  analyticsText: {
    fontSize: 16,
    color: '#666',
  },
  accessDeniedCard: {
    margin: 16,
    elevation: 2,
  },
  accessDeniedTitle: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    color: '#F44336',
  },
  accessDeniedText: {
    textAlign: 'center',
    color: '#666',
  },
});
