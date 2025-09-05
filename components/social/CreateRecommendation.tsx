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
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Avatar,
  Switch,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Recommendation } from '../../services/RecommendationService';
import {
  sendRecommendation,
  fetchFriends,
} from '../../store/slices/recommendationSlice';
import { safeHapticImpact } from '../../utils/haptics';

interface CreateRecommendationProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialAsset?: {
    symbol: string;
    name: string;
    price: number;
    change: number;
  };
}

export const CreateRecommendation: React.FC<CreateRecommendationProps> = ({
  onClose,
  onSuccess,
  initialAsset,
}) => {
  const dispatch = useDispatch();
  const { friends, loading } = useSelector((state: RootState) => state.recommendations);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [type, setType] = useState<Recommendation['type']>('stock');
  const [recommendation, setRecommendation] = useState<Recommendation['recommendation']>('buy');
  const [reasoning, setReasoning] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<Recommendation['timeHorizon']>('medium');
  const [riskLevel, setRiskLevel] = useState<Recommendation['riskLevel']>('medium');
  const [isTimeSensitive, setIsTimeSensitive] = useState(false);
  const [assetSymbol, setAssetSymbol] = useState(initialAsset?.symbol || '');
  const [assetName, setAssetName] = useState(initialAsset?.name || '');
  const [assetPrice, setAssetPrice] = useState(initialAsset?.price || 0);
  const [assetChange, setAssetChange] = useState(initialAsset?.change || 0);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchFriends(user.uid) as any);
    }
  }, [user?.uid, dispatch]);

  const handleSend = async () => {
    if (!selectedFriend || !reasoning.trim()) {
      Alert.alert('Missing Information', 'Please select a friend and provide reasoning for your recommendation.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to send recommendations.');
      return;
    }

    try {
      const friend = friends.find(f => f.id === selectedFriend);
      if (!friend) {
        Alert.alert('Error', 'Selected friend not found.');
        return;
      }

      const recommendationData: Omit<Recommendation, 'id' | 'fromUserId' | 'fromUserName' | 'fromUserAvatar' | 'toUserId' | 'toUserName' | 'createdAt' | 'updatedAt' | 'status'> = {
        type,
        assetSymbol: assetSymbol || undefined,
        assetName: assetName || undefined,
        assetPrice: assetPrice || undefined,
        assetChange: assetChange || undefined,
        recommendation,
        reasoning: reasoning.trim(),
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        timeHorizon,
        riskLevel,
        isTimeSensitive,
      };

      await dispatch(sendRecommendation({
        fromUserId: user.uid,
        fromUserName: user.displayName || 'Anonymous',
        fromUserAvatar: user.photoURL,
        toUserId: selectedFriend,
        toUserName: friend.name,
        recommendationData,
      }) as any);

      safeHapticImpact();
      Alert.alert('Success', 'Recommendation sent successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error sending recommendation:', error);
      Alert.alert('Error', 'Failed to send recommendation. Please try again.');
    }
  };

  const renderFriendSelector = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Send to Friend</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsList}>
          {friends.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={[
                styles.friendItem,
                selectedFriend === friend.id && styles.selectedFriend,
              ]}
              onPress={() => setSelectedFriend(friend.id)}
            >
              <Avatar.Text
                size={50}
                label={friend.name.charAt(0).toUpperCase()}
                style={[
                  styles.friendAvatar,
                  selectedFriend === friend.id && styles.selectedFriendAvatar,
                ]}
              />
              <Text style={[
                styles.friendName,
                selectedFriend === friend.id && styles.selectedFriendName,
              ]}>
                {friend.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderAssetInfo = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Asset Information</Text>
        <View style={styles.assetRow}>
          <TextInput
            label="Symbol"
            value={assetSymbol}
            onChangeText={setAssetSymbol}
            style={styles.assetInput}
            mode="outlined"
            dense
          />
          <TextInput
            label="Name"
            value={assetName}
            onChangeText={setAssetName}
            style={styles.assetInput}
            mode="outlined"
            dense
          />
        </View>
        <View style={styles.assetRow}>
          <TextInput
            label="Current Price"
            value={assetPrice.toString()}
            onChangeText={(text) => setAssetPrice(parseFloat(text) || 0)}
            style={styles.assetInput}
            mode="outlined"
            dense
            keyboardType="numeric"
          />
          <TextInput
            label="Change %"
            value={assetChange.toString()}
            onChangeText={(text) => setAssetChange(parseFloat(text) || 0)}
            style={styles.assetInput}
            mode="outlined"
            dense
            keyboardType="numeric"
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecommendationType = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Recommendation Type</Text>
        <SegmentedButtons
          value={type}
          onValueChange={(value) => setType(value as Recommendation['type'])}
          buttons={[
            { value: 'stock', label: 'Stock', icon: 'chart-line' },
            { value: 'crypto', label: 'Crypto', icon: 'bitcoin' },
            { value: 'strategy', label: 'Strategy', icon: 'strategy' },
            { value: 'education', label: 'Education', icon: 'school' },
          ]}
          style={styles.segmentedButtons}
        />
      </Card.Content>
    </Card>
  );

  const renderRecommendationAction = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Recommendation</Text>
        <View style={styles.chipContainer}>
          {(['buy', 'sell', 'hold', 'watch'] as const).map((action) => (
            <Chip
              key={action}
              selected={recommendation === action}
              onPress={() => setRecommendation(action)}
              style={[
                styles.recommendationChip,
                recommendation === action && styles.selectedChip,
              ]}
              textStyle={[
                styles.chipText,
                recommendation === action && styles.selectedChipText,
              ]}
            >
              {action.toUpperCase()}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderReasoning = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Your Reasoning</Text>
        <TextInput
          label="Explain why you're making this recommendation..."
          value={reasoning}
          onChangeText={setReasoning}
          multiline
          numberOfLines={4}
          mode="outlined"
          style={styles.reasoningInput}
        />
      </Card.Content>
    </Card>
  );

  const renderAdditionalOptions = () => (
    <Card style={styles.section}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Additional Options</Text>
        
        <TextInput
          label="Target Price (optional)"
          value={targetPrice}
          onChangeText={setTargetPrice}
          mode="outlined"
          keyboardType="numeric"
          style={styles.optionInput}
        />

        <Text style={styles.optionLabel}>Time Horizon</Text>
        <SegmentedButtons
          value={timeHorizon}
          onValueChange={(value) => setTimeHorizon(value as Recommendation['timeHorizon'])}
          buttons={[
            { value: 'short', label: 'Short' },
            { value: 'medium', label: 'Medium' },
            { value: 'long', label: 'Long' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text style={styles.optionLabel}>Risk Level</Text>
        <SegmentedButtons
          value={riskLevel}
          onValueChange={(value) => setRiskLevel(value as Recommendation['riskLevel'])}
          buttons={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Time Sensitive</Text>
          <Switch
            value={isTimeSensitive}
            onValueChange={setIsTimeSensitive}
            color="#6CA393"
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Recommendation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderFriendSelector()}
        {renderAssetInfo()}
        {renderRecommendationType()}
        {renderRecommendationAction()}
        {renderReasoning()}
        {renderAdditionalOptions()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSend}
          style={styles.sendButton}
          loading={loading.friends}
          disabled={!selectedFriend || !reasoning.trim()}
        >
          Send Recommendation
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  friendsList: {
    marginTop: 8,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFriend: {
    borderColor: '#6CA393',
    backgroundColor: '#f0f9f5',
  },
  friendAvatar: {
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedFriendAvatar: {
    backgroundColor: '#6CA393',
  },
  friendName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedFriendName: {
    color: '#6CA393',
    fontWeight: 'bold',
  },
  assetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  assetInput: {
    flex: 1,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  recommendationChip: {
    borderColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#6CA393',
    borderColor: '#6CA393',
  },
  chipText: {
    color: '#666',
  },
  selectedChipText: {
    color: '#fff',
  },
  reasoningInput: {
    marginTop: 8,
  },
  optionInput: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  sendButton: {
    flex: 2,
    backgroundColor: '#6CA393',
  },
});
