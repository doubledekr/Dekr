import { Newsletter } from './NewsletterService';
import { logEvent, AnalyticsEvents } from './analytics';

export interface EmailSubscriber {
  id: string;
  email: string;
  name: string;
  preferences: {
    frequency: 'weekly' | 'monthly' | 'never';
    categories: string[];
    format: 'html' | 'text';
  };
  subscribedAt: Date;
  lastEmailSent?: Date;
  status: 'active' | 'unsubscribed' | 'bounced';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
}

export class EmailService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Using Resend API for email delivery
    this.apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
    this.baseUrl = 'https://api.resend.com';
  }

  // Convert newsletter content to HTML email
  private convertNewsletterToHTML(newsletter: Newsletter): string {
    const htmlContent = this.markdownToHTML(newsletter.content);
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${newsletter.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              margin: 20px;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 8px 0 0 0;
              opacity: 0.9;
              font-size: 14px;
            }
            .content {
              padding: 30px 20px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              color: #1976d2;
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 15px;
              border-bottom: 2px solid #e3f2fd;
              padding-bottom: 8px;
            }
            .section p {
              margin-bottom: 15px;
              font-size: 16px;
              line-height: 1.6;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            .stat-item {
              text-align: center;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .stat-number {
              font-size: 24px;
              font-weight: 700;
              color: #1976d2;
              display: block;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .cta-button {
              display: inline-block;
              background-color: #1976d2;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 10px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #e0e0e0;
            }
            .footer a {
              color: #1976d2;
              text-decoration: none;
            }
            .unsubscribe {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e0e0e0;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
              }
              .header, .content, .footer {
                padding: 20px 15px;
              }
              .stats-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Dekr Weekly Newsletter</h1>
              <p>Community Insights & Market Pulse</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>📊 This Week's Community Stats</h2>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-number">${newsletter.data.weeklyStats.activeUsers}</span>
                    <span class="stat-label">Active Users</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${newsletter.data.weeklyStats.newSignups}</span>
                    <span class="stat-label">New Members</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${newsletter.data.weeklyStats.totalPredictions}</span>
                    <span class="stat-label">Predictions</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${newsletter.data.weeklyStats.accuracyRate}%</span>
                    <span class="stat-label">Accuracy</span>
                  </div>
                </div>
              </div>
              
              ${htmlContent}
              
              <div class="section">
                <h2>🚀 Join the Community</h2>
                <p>Ready to start your investing journey with the Dekr community?</p>
                <a href="https://dekr.app" class="cta-button">Open Dekr App</a>
              </div>
            </div>
            
            <div class="footer">
              <p>You're receiving this because you're part of the Dekr community.</p>
              <p>This newsletter was generated on ${new Date(newsletter.publishedAt.toDate()).toLocaleDateString()}.</p>
              
              <div class="unsubscribe">
                <p>
                  <a href="https://dekr.app/unsubscribe">Unsubscribe</a> | 
                  <a href="https://dekr.app/preferences">Email Preferences</a> | 
                  <a href="https://dekr.app/support">Support</a>
                </p>
                <p>© 2024 Dekr. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Convert markdown-like content to HTML
  private markdownToHTML(content: string): string {
    return content
      // Convert headers
      .replace(/\*\*(.*?)\*\*/g, '<h2 style="color: #1976d2; font-size: 18px; font-weight: 600; margin: 20px 0 10px 0;">$1</h2>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Wrap in paragraphs
      .replace(/^(.*)$/gm, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      // Clean up paragraph wrapping around headers
      .replace(/<p><h2/g, '<h2')
      .replace(/<\/h2><\/p>/g, '</h2>');
  }

  // Send newsletter to subscribers
  async sendNewsletterToSubscribers(newsletter: Newsletter): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    try {
      logEvent(AnalyticsEvents.SEND_NEWSLETTER, {
        newsletter_id: newsletter.id,
        title: newsletter.title,
      });

      const subscribers = await this.getActiveSubscribers();
      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      const htmlContent = this.convertNewsletterToHTML(newsletter);
      const textContent = this.convertHTMLToText(htmlContent);

      // Send emails in batches to avoid rate limits
      const batchSize = 50;
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (subscriber) => {
          try {
            await this.sendEmail({
              to: subscriber.email,
              subject: newsletter.title,
              html: htmlContent,
              text: textContent,
              headers: {
                'List-Unsubscribe': '<https://dekr.app/unsubscribe>',
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            });

            // Update subscriber's last email sent
            await this.updateSubscriberLastEmail(subscriber.id, new Date());
            results.sent++;
          } catch (error) {
            console.error(`Failed to send email to ${subscriber.email}:`, error);
            results.failed++;
            results.errors.push(`${subscriber.email}: ${error}`);
          }
        });

        await Promise.all(batchPromises);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending newsletter to subscribers:', error);
      throw error;
    }
  }

  // Send individual email
  private async sendEmail({
    to,
    subject,
    html,
    text,
    headers = {},
  }: {
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
  }): Promise<void> {
    if (!this.apiKey) {
      console.warn('Email API key not configured, skipping email send');
      return;
    }

    const response = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Dekr Newsletter <newsletter@dekr.app>',
        to: [to],
        subject,
        html,
        text,
        headers,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email send failed: ${errorData.message || response.statusText}`);
    }
  }

  // Convert HTML to plain text
  private convertHTMLToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Get active email subscribers
  private async getActiveSubscribers(): Promise<EmailSubscriber[]> {
    // This would query your Firebase collection for email subscribers
    // For now, returning mock data
    return [
      {
        id: 'subscriber1',
        email: 'user1@example.com',
        name: 'John Doe',
        preferences: {
          frequency: 'weekly',
          categories: ['market-updates', 'community-highlights'],
          format: 'html',
        },
        subscribedAt: new Date(),
        status: 'active',
      },
      {
        id: 'subscriber2',
        email: 'user2@example.com',
        name: 'Jane Smith',
        preferences: {
          frequency: 'weekly',
          categories: ['all'],
          format: 'html',
        },
        subscribedAt: new Date(),
        status: 'active',
      },
    ];
  }

  // Update subscriber's last email sent timestamp
  private async updateSubscriberLastEmail(subscriberId: string, timestamp: Date): Promise<void> {
    // This would update the subscriber record in Firebase
    console.log(`Updated last email sent for subscriber ${subscriberId} to ${timestamp}`);
  }

  // Add new email subscriber
  async addSubscriber(email: string, name: string, preferences: EmailSubscriber['preferences']): Promise<void> {
    try {
      const subscriber: EmailSubscriber = {
        id: `subscriber_${Date.now()}`,
        email,
        name,
        preferences,
        subscribedAt: new Date(),
        status: 'active',
      };

      // This would save to Firebase
      console.log('Added new subscriber:', subscriber);

      logEvent(AnalyticsEvents.ADD_EMAIL_SUBSCRIBER, {
        email,
        preferences: preferences.frequency,
      });
    } catch (error) {
      console.error('Error adding email subscriber:', error);
      throw error;
    }
  }

  // Remove email subscriber
  async removeSubscriber(email: string): Promise<void> {
    try {
      // This would update the subscriber status in Firebase
      console.log('Removed subscriber:', email);

      logEvent(AnalyticsEvents.REMOVE_EMAIL_SUBSCRIBER, {
        email,
      });
    } catch (error) {
      console.error('Error removing email subscriber:', error);
      throw error;
    }
  }

  // Get email delivery statistics
  async getEmailStats(newsletterId: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }> {
    // This would query your email service provider's API for delivery stats
    return {
      sent: 100,
      delivered: 95,
      opened: 60,
      clicked: 25,
      bounced: 3,
      unsubscribed: 2,
    };
  }
}

export const emailService = new EmailService();
