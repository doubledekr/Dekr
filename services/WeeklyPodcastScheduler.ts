import { weeklyPodcastService } from './WeeklyPodcastService';

export interface ScheduleConfig {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string;
  enabled: boolean;
}

export class WeeklyPodcastScheduler {
  private scheduleConfig: ScheduleConfig = {
    dayOfWeek: 5, // Friday
    hour: 16, // 4 PM
    minute: 0, // Top of the hour
    timezone: 'America/New_York',
    enabled: true
  };

  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<ScheduleConfig>) {
    if (config) {
      this.scheduleConfig = { ...this.scheduleConfig, ...config };
    }
  }

  // Start the scheduler
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Weekly podcast scheduler is already running');
      return;
    }

    if (!this.scheduleConfig.enabled) {
      console.log('⚠️ Weekly podcast scheduler is disabled');
      return;
    }

    console.log('📅 Starting weekly podcast scheduler...');
    console.log(`Schedule: Every ${this.getDayName(this.scheduleConfig.dayOfWeek)} at ${this.formatTime(this.scheduleConfig.hour, this.scheduleConfig.minute)} ${this.scheduleConfig.timezone}`);

    // Check every minute if it's time to generate the podcast
    this.intervalId = setInterval(() => {
      this.checkAndGeneratePodcast();
    }, 60000); // Check every minute

    this.isRunning = true;
    console.log('✅ Weekly podcast scheduler started');
  }

  // Stop the scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Weekly podcast scheduler stopped');
  }

  // Check if it's time to generate the podcast
  private checkAndGeneratePodcast(): void {
    const now = new Date();
    const targetDay = this.scheduleConfig.dayOfWeek;
    const targetHour = this.scheduleConfig.hour;
    const targetMinute = this.scheduleConfig.minute;

    // Check if it's the right day of the week
    if (now.getDay() !== targetDay) {
      return;
    }

    // Check if it's the right time (within the same minute)
    if (now.getHours() !== targetHour || now.getMinutes() !== targetMinute) {
      return;
    }

    // Check if we've already generated a podcast this week
    this.generateWeeklyPodcastIfNeeded();
  }

  // Generate weekly podcast if needed
  private async generateWeeklyPodcastIfNeeded(): Promise<void> {
    try {
      console.log('🎙️ Checking if weekly podcast needs to be generated...');
      
      const { weekOf } = this.getCurrentWeek();
      const existingPodcast = await weeklyPodcastService.getExistingWeeklyPodcast(weekOf);
      
      if (existingPodcast) {
        console.log('✅ Weekly podcast already exists for this week:', weekOf);
        return;
      }

      console.log('🚀 Generating new weekly community podcast...');
      const podcast = await weeklyPodcastService.generateWeeklyPodcast();
      
      console.log('✅ Weekly podcast generated successfully!');
      console.log(`- Title: ${podcast.title}`);
      console.log(`- Duration: ${Math.floor(podcast.duration / 60)} minutes`);
      console.log(`- Audio URL: ${podcast.audioUrl}`);
      
      // Here you could add notifications, email alerts, etc.
      this.notifyPodcastGenerated(podcast);
      
    } catch (error) {
      console.error('❌ Error generating weekly podcast:', error);
    }
  }

  // Get current week identifier
  private getCurrentWeek(): { start: Date; end: Date; weekOf: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday)
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // End of week (Saturday)
    end.setHours(23, 59, 59, 999);
    
    const weekOf = start.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return { start, end, weekOf };
  }

  // Notify that podcast has been generated
  private notifyPodcastGenerated(podcast: any): void {
    console.log('📢 Weekly podcast notification:');
    console.log(`- New episode: ${podcast.title}`);
    console.log(`- Community highlights: ${podcast.dataSources.communityMembers} members featured`);
    console.log(`- Market data: ${podcast.dataSources.newsCount} news articles, ${podcast.dataSources.stockCount} stocks analyzed`);
    
    // Here you could:
    // - Send push notifications to all users
    // - Send email newsletter
    // - Post to social media
    // - Update app UI
  }

  // Get day name from day number
  private getDayName(dayNumber: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  }

  // Format time for display
  private formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }

  // Update schedule configuration
  updateSchedule(config: Partial<ScheduleConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.scheduleConfig = { ...this.scheduleConfig, ...config };
    
    if (wasRunning) {
      this.start();
    }
    
    console.log('📅 Schedule updated:', this.scheduleConfig);
  }

  // Get current schedule configuration
  getSchedule(): ScheduleConfig {
    return { ...this.scheduleConfig };
  }

  // Check if scheduler is running
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  // Manually trigger podcast generation (for testing)
  async generatePodcastNow(): Promise<void> {
    console.log('🎙️ Manually triggering weekly podcast generation...');
    await this.generateWeeklyPodcastIfNeeded();
  }

  // Get next scheduled time
  getNextScheduledTime(): Date {
    const now = new Date();
    const next = new Date(now);
    
    // Find next occurrence of the scheduled day and time
    const daysUntilTarget = (this.scheduleConfig.dayOfWeek - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + daysUntilTarget);
    next.setHours(this.scheduleConfig.hour, this.scheduleConfig.minute, 0, 0);
    
    // If the time has already passed today, move to next week
    if (next <= now) {
      next.setDate(next.getDate() + 7);
    }
    
    return next;
  }

  // Get status information
  getStatus(): {
    isRunning: boolean;
    schedule: ScheduleConfig;
    nextRun: Date;
    lastCheck: Date;
  } {
    return {
      isRunning: this.isRunning,
      schedule: this.getSchedule(),
      nextRun: this.getNextScheduledTime(),
      lastCheck: new Date()
    };
  }
}

// Create singleton instance
export const weeklyPodcastScheduler = new WeeklyPodcastScheduler();

// Auto-start scheduler if enabled (for production)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  weeklyPodcastScheduler.start();
}
