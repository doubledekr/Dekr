import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Card, Chip, Button, useTheme, Portal, Modal } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);

export interface StrategyComponent {
  id: string;
  type: 'indicator' | 'condition' | 'action';
  name: string;
  description: string;
  icon: string;
  category: string;
  parameters?: Record<string, any>;
}

export interface StrategyRule {
  id: string;
  condition: StrategyComponent;
  action: StrategyComponent;
  isActive: boolean;
}

export interface StrategyBuilderData {
  id: string;
  name: string;
  description: string;
  rules: StrategyRule[];
  performance: {
    winRate: number;
    avgReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  isPublic: boolean;
  author: {
    id: string;
    name: string;
    reputation: number;
  };
  tags: string[];
  createdAt: Date;
  backtestResults?: {
    totalReturn: number;
    volatility: number;
    trades: number;
  };
}

interface StrategyBuilderCardProps {
  data: StrategyBuilderData;
  onEdit?: (strategyId: string) => void;
  onBacktest?: (strategyId: string) => void;
  onShare?: (strategyId: string) => void;
  onDuplicate?: (strategyId: string) => void;
  onDelete?: (strategyId: string) => void;
  onTogglePublic?: (strategyId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export function StrategyBuilderCard({
  data,
  onEdit,
  onBacktest,
  onShare,
  onDuplicate,
  onDelete,
  onTogglePublic,
  onViewProfile,
}: StrategyBuilderCardProps) {
  const theme = useTheme();
  const [showRules, setShowRules] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleAction = (action: string) => {
    safeHapticImpact();
    setShowActions(false);
    
    switch (action) {
      case 'edit':
        onEdit?.(data.id);
        break;
      case 'backtest':
        onBacktest?.(data.id);
        break;
      case 'share':
        onShare?.(data.id);
        break;
      case 'duplicate':
        onDuplicate?.(data.id);
        break;
      case 'delete':
        onDelete?.(data.id);
        break;
      case 'toggle_public':
        onTogglePublic?.(data.id);
        break;
    }
  };

  const getPerformanceColor = (value: number, type: 'positive' | 'negative') => {
    if (type === 'positive') {
      return value >= 0 ? '#10b981' : '#ef4444';
    } else {
      return value <= 0 ? '#10b981' : '#ef4444';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {data.name}
              </Text>
              <View style={styles.metaRow}>
                <Chip 
                  mode="outlined" 
                  compact
                  textStyle={styles.publicChip}
                >
                  {data.isPublic ? 'Public' : 'Private'}
                </Chip>
                <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                  {formatDate(data.createdAt)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowActions(true)}
            >
              <MaterialCommunityIcons 
                name="dots-vertical" 
                size={24} 
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {data.description}
          </Text>

          {/* Author */}
          <TouchableOpacity 
            style={styles.authorSection}
            onPress={() => onViewProfile?.(data.author.id)}
          >
            <MaterialCommunityIcons 
              name="account-circle" 
              size={20} 
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.authorName, { color: theme.colors.onSurface }]}>
              {data.author.name}
            </Text>
            <Chip 
              mode="outlined" 
              compact
              textStyle={styles.reputationChip}
            >
              {data.author.reputation} rep
            </Chip>
          </TouchableOpacity>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {data.tags.slice(0, 3).map((tag, index) => (
              <Chip 
                key={index}
                mode="outlined" 
                compact
                textStyle={styles.tagText}
              >
                {tag}
              </Chip>
            ))}
            {data.tags.length > 3 && (
              <Chip 
                mode="outlined" 
                compact
                textStyle={styles.tagText}
              >
                +{data.tags.length - 3}
              </Chip>
            )}
          </View>

          {/* Performance Metrics */}
          <View style={styles.performanceSection}>
            <Text style={[styles.performanceTitle, { color: theme.colors.onSurface }]}>
              Performance Metrics
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: getPerformanceColor(data.performance.winRate, 'positive') }]}>
                  {data.performance.winRate.toFixed(1)}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Win Rate
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: getPerformanceColor(data.performance.avgReturn, 'positive') }]}>
                  {data.performance.avgReturn >= 0 ? '+' : ''}{data.performance.avgReturn.toFixed(1)}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Avg Return
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: getPerformanceColor(data.performance.maxDrawdown, 'negative') }]}>
                  {data.performance.maxDrawdown.toFixed(1)}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Max Drawdown
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: getPerformanceColor(data.performance.sharpeRatio, 'positive') }]}>
                  {data.performance.sharpeRatio.toFixed(2)}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Sharpe Ratio
                </Text>
              </View>
            </View>
          </View>

          {/* Backtest Results */}
          {data.backtestResults && (
            <View style={styles.backtestSection}>
              <Text style={[styles.backtestTitle, { color: theme.colors.onSurface }]}>
                Backtest Results
              </Text>
              <View style={styles.backtestGrid}>
                <View style={styles.backtestItem}>
                  <Text style={[styles.backtestValue, { color: getPerformanceColor(data.backtestResults.totalReturn, 'positive') }]}>
                    {data.backtestResults.totalReturn >= 0 ? '+' : ''}{data.backtestResults.totalReturn.toFixed(1)}%
                  </Text>
                  <Text style={[styles.backtestLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Total Return
                  </Text>
                </View>
                <View style={styles.backtestItem}>
                  <Text style={[styles.backtestValue, { color: theme.colors.onSurface }]}>
                    {data.backtestResults.volatility.toFixed(1)}%
                  </Text>
                  <Text style={[styles.backtestLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Volatility
                  </Text>
                </View>
                <View style={styles.backtestItem}>
                  <Text style={[styles.backtestValue, { color: theme.colors.onSurface }]}>
                    {data.backtestResults.trades}
                  </Text>
                  <Text style={[styles.backtestLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Trades
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Rules Section */}
          <TouchableOpacity
            style={styles.rulesToggle}
            onPress={() => setShowRules(!showRules)}
          >
            <Text style={[styles.rulesTitle, { color: theme.colors.onSurface }]}>
              Strategy Rules ({data.rules.length})
            </Text>
            <MaterialCommunityIcons 
              name={showRules ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {showRules && (
            <View style={styles.rulesContainer}>
              {data.rules.map((rule, index) => (
                <View key={rule.id} style={styles.ruleItem}>
                  <View style={styles.ruleHeader}>
                    <Text style={[styles.ruleNumber, { color: theme.colors.onSurfaceVariant }]}>
                      Rule {index + 1}
                    </Text>
                    <Chip 
                      mode={rule.isActive ? "filled" : "outlined"}
                      compact
                      textStyle={rule.isActive ? styles.activeChipText : undefined}
                      style={rule.isActive ? styles.activeChip : undefined}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Chip>
                  </View>
                  <View style={styles.ruleContent}>
                    <View style={styles.ruleCondition}>
                      <MaterialCommunityIcons 
                        name={rule.condition.icon as any} 
                        size={16} 
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={[styles.ruleText, { color: theme.colors.onSurface }]}>
                        {rule.condition.name}
                      </Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="arrow-right" 
                      size={16} 
                      color={theme.colors.onSurfaceVariant}
                    />
                    <View style={styles.ruleAction}>
                      <MaterialCommunityIcons 
                        name={rule.action.icon as any} 
                        size={16} 
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={[styles.ruleText, { color: theme.colors.onSurface }]}>
                        {rule.action.name}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleAction('backtest')}
              style={styles.actionButton}
              icon="chart-line"
            >
              Backtest
            </Button>
            <Button
              mode="contained"
              onPress={() => handleAction('edit')}
              style={styles.actionButton}
              icon="pencil"
            >
              Edit
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Actions Modal */}
      <Portal>
        <Modal
          visible={showActions}
          onDismiss={() => setShowActions(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Strategy Actions
          </Text>
          
          <TouchableOpacity
            style={styles.modalAction}
            onPress={() => handleAction('edit')}
          >
            <MaterialCommunityIcons name="pencil" size={24} color={theme.colors.onSurface} />
            <Text style={[styles.modalActionText, { color: theme.colors.onSurface }]}>
              Edit Strategy
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modalAction}
            onPress={() => handleAction('backtest')}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.onSurface} />
            <Text style={[styles.modalActionText, { color: theme.colors.onSurface }]}>
              Run Backtest
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modalAction}
            onPress={() => handleAction('share')}
          >
            <MaterialCommunityIcons name="share" size={24} color={theme.colors.onSurface} />
            <Text style={[styles.modalActionText, { color: theme.colors.onSurface }]}>
              Share Strategy
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modalAction}
            onPress={() => handleAction('duplicate')}
          >
            <MaterialCommunityIcons name="content-duplicate" size={24} color={theme.colors.onSurface} />
            <Text style={[styles.modalActionText, { color: theme.colors.onSurface }]}>
              Duplicate
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modalAction}
            onPress={() => handleAction('toggle_public')}
          >
            <MaterialCommunityIcons 
              name={data.isPublic ? "eye-off" : "eye"} 
              size={24} 
              color={theme.colors.onSurface} 
            />
            <Text style={[styles.modalActionText, { color: theme.colors.onSurface }]}>
              {data.isPublic ? 'Make Private' : 'Make Public'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalAction, styles.deleteAction]}
            onPress={() => handleAction('delete')}
          >
            <MaterialCommunityIcons name="delete" size={24} color="#ef4444" />
            <Text style={[styles.modalActionText, { color: '#ef4444' }]}>
              Delete Strategy
            </Text>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publicChip: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
  moreButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  reputationChip: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  backtestSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  backtestTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  backtestGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  backtestItem: {
    alignItems: 'center',
  },
  backtestValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  backtestLabel: {
    fontSize: 10,
  },
  rulesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 12,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rulesContainer: {
    marginBottom: 16,
  },
  ruleItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeChip: {
    backgroundColor: '#10b981',
  },
  activeChipText: {
    color: '#ffffff',
  },
  ruleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  ruleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  ruleText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  modalActionText: {
    fontSize: 16,
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 16,
  },
});
