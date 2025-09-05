import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  ProgressBar,
  Chip,
  Icon,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Newsletter } from '../../services/NewsletterService';
import { emailService } from '../../services/EmailService';

interface NewsletterAnalyticsProps {
  newsletter: Newsletter;
}

interface EmailStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export const NewsletterAnalytics: React.FC<NewsletterAnalyticsProps> = ({ newsletter }) => {
  const theme = useTheme();
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmailStats();
  }, [newsletter.id]);

  const loadEmailStats = async () => {
    try {
      setIsLoading(true);
      const stats = await emailService.getEmailStats(newsletter.id);
      setEmailStats(stats);
    } catch (error) {
      console.error('Error loading email stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRate = (numerator: number, denominator: number): number => {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
  };

  const getPerformanceColor = (rate: number): string => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FF9800';
    return '#F44336';
  };

  const getPerformanceLabel = (rate: number): string => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Average';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Loading Analytics...</Title>
        </Card.Content>
      </Card>
    );
  }

  if (!emailStats) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Analytics Unavailable</Title>
          <Paragraph>Email statistics are not available for this newsletter.</Paragraph>
        </Card.Content>
      </Card>
    );
  }

  const deliveryRate = calculateRate(emailStats.delivered, emailStats.sent);
  const openRate = calculateRate(emailStats.opened, emailStats.delivered);
  const clickRate = calculateRate(emailStats.clicked, emailStats.opened);
  const bounceRate = calculateRate(emailStats.bounced, emailStats.sent);
  const unsubscribeRate = calculateRate(emailStats.unsubscribed, emailStats.delivered);

  return (
    <ScrollView style={styles.container}>
      {/* Overview Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Icon source="chart-line" size={24} color={theme.colors.primary} />
            <Title style={styles.title}>Newsletter Performance</Title>
          </View>
          
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{newsletter.stats.views}</Text>
              <Text style={styles.overviewLabel}>App Views</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{newsletter.stats.shares}</Text>
              <Text style={styles.overviewLabel}>Shares</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{newsletter.stats.likes}</Text>
              <Text style={styles.overviewLabel}>Likes</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{Math.round(newsletter.stats.engagementTime / 60)}m</Text>
              <Text style={styles.overviewLabel}>Avg. Read Time</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Email Delivery Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Email Delivery</Title>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Sent</Text>
              <Text style={styles.metricValue}>{emailStats.sent}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Delivered</Text>
              <Text style={styles.metricValue}>{emailStats.delivered}</Text>
              <Text style={[styles.metricRate, { color: getPerformanceColor(deliveryRate) }]}>
                {deliveryRate}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Bounced</Text>
              <Text style={[styles.metricValue, { color: bounceRate > 5 ? '#F44336' : '#4CAF50' }]}>
                {emailStats.bounced}
              </Text>
              <Text style={[styles.metricRate, { color: bounceRate > 5 ? '#F44336' : '#4CAF50' }]}>
                {bounceRate}%
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Delivery Rate</Text>
            <ProgressBar
              progress={deliveryRate / 100}
              color={getPerformanceColor(deliveryRate)}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, { color: getPerformanceColor(deliveryRate) }]}>
              {getPerformanceLabel(deliveryRate)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Engagement Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Engagement</Title>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Opened</Text>
              <Text style={styles.metricValue}>{emailStats.opened}</Text>
              <Text style={[styles.metricRate, { color: getPerformanceColor(openRate) }]}>
                {openRate}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Clicked</Text>
              <Text style={styles.metricValue}>{emailStats.clicked}</Text>
              <Text style={[styles.metricRate, { color: getPerformanceColor(clickRate) }]}>
                {clickRate}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Unsubscribed</Text>
              <Text style={[styles.metricValue, { color: unsubscribeRate > 2 ? '#F44336' : '#4CAF50' }]}>
                {emailStats.unsubscribed}
              </Text>
              <Text style={[styles.metricRate, { color: unsubscribeRate > 2 ? '#F44336' : '#4CAF50' }]}>
                {unsubscribeRate}%
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Open Rate</Text>
            <ProgressBar
              progress={openRate / 100}
              color={getPerformanceColor(openRate)}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, { color: getPerformanceColor(openRate) }]}>
              {getPerformanceLabel(openRate)}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Click Rate</Text>
            <ProgressBar
              progress={clickRate / 100}
              color={getPerformanceColor(clickRate)}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, { color: getPerformanceColor(clickRate) }]}>
              {getPerformanceLabel(clickRate)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Performance Insights</Title>
          
          <View style={styles.insightsContainer}>
            {deliveryRate >= 95 && (
              <View style={styles.insightItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.insightText}>Excellent delivery rate! Your email list is healthy.</Text>
              </View>
            )}
            
            {openRate >= 25 && (
              <View style={styles.insightItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.insightText}>Great open rate! Your subject lines are engaging.</Text>
              </View>
            )}
            
            {clickRate >= 3 && (
              <View style={styles.insightItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.insightText}>Good click rate! Content is resonating with readers.</Text>
              </View>
            )}
            
            {bounceRate > 5 && (
              <View style={styles.insightItem}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
                <Text style={styles.insightText}>High bounce rate. Consider cleaning your email list.</Text>
              </View>
            )}
            
            {unsubscribeRate > 2 && (
              <View style={styles.insightItem}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
                <Text style={styles.insightText}>Higher than usual unsubscribes. Review content relevance.</Text>
              </View>
            )}
            
            {openRate < 20 && (
              <View style={styles.insightItem}>
                <MaterialCommunityIcons name="lightbulb" size={20} color="#FF9800" />
                <Text style={styles.insightText}>Try A/B testing different subject lines to improve open rates.</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Benchmark Comparison */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Industry Benchmarks</Title>
          
          <View style={styles.benchmarkContainer}>
            <View style={styles.benchmarkRow}>
              <Text style={styles.benchmarkLabel}>Open Rate</Text>
              <View style={styles.benchmarkComparison}>
                <Text style={styles.benchmarkValue}>{openRate}%</Text>
                <Text style={styles.benchmarkIndustry}>vs 21% industry avg</Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.benchmarkChip,
                    { borderColor: openRate >= 21 ? '#4CAF50' : '#F44336' }
                  ]}
                  textStyle={{ color: openRate >= 21 ? '#4CAF50' : '#F44336' }}
                >
                  {openRate >= 21 ? 'Above Average' : 'Below Average'}
                </Chip>
              </View>
            </View>
            
            <View style={styles.benchmarkRow}>
              <Text style={styles.benchmarkLabel}>Click Rate</Text>
              <View style={styles.benchmarkComparison}>
                <Text style={styles.benchmarkValue}>{clickRate}%</Text>
                <Text style={styles.benchmarkIndustry}>vs 2.6% industry avg</Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.benchmarkChip,
                    { borderColor: clickRate >= 2.6 ? '#4CAF50' : '#F44336' }
                  ]}
                  textStyle={{ color: clickRate >= 2.6 ? '#4CAF50' : '#F44336' }}
                >
                  {clickRate >= 2.6 ? 'Above Average' : 'Below Average'}
                </Chip>
              </View>
            </View>
            
            <View style={styles.benchmarkRow}>
              <Text style={styles.benchmarkLabel}>Bounce Rate</Text>
              <View style={styles.benchmarkComparison}>
                <Text style={styles.benchmarkValue}>{bounceRate}%</Text>
                <Text style={styles.benchmarkIndustry}>vs 2% industry avg</Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.benchmarkChip,
                    { borderColor: bounceRate <= 2 ? '#4CAF50' : '#F44336' }
                  ]}
                  textStyle={{ color: bounceRate <= 2 ? '#4CAF50' : '#F44336' }}
                >
                  {bounceRate <= 2 ? 'Good' : 'Needs Attention'}
                </Chip>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976d2',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  metricRate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  progressBar: {
    height: 8,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightsContainer: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  benchmarkContainer: {
    marginTop: 8,
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  benchmarkLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  benchmarkComparison: {
    alignItems: 'flex-end',
    flex: 1,
  },
  benchmarkValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  benchmarkIndustry: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  benchmarkChip: {
    marginTop: 4,
  },
});
