import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const host = this.config.get('SMTP_HOST');
    const port = this.config.get('SMTP_PORT');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port || '587', 10),
        secure: false,
        auth: { user, pass },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      console.log('Email: Using JSON transport (SMTP not configured). Emails will be logged to console.');
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = this.config.get('MAIL_FROM') || 'noreply@lotusgift.com';
    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      if (info.message) {
        console.log('Email (dev mode):', JSON.parse(info.message));
      }
      return { success: true };
    } catch (error) {
      console.error('Email send failed:', error);
      return { success: false, error };
    }
  }

  async sendQuoteNotification(quoteNumber: string, clientEmail: string, clientName: string) {
    const subject = `Quote ${quoteNumber} - Lotus Gift`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B7A3E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Lotus Gift</h1>
        </div>
        <div style="padding: 30px; background: #f8fafb;">
          <h2>Hello ${clientName},</h2>
          <p>Your quote <strong>${quoteNumber}</strong> has been received.</p>
          <p>Our team will review your requirements and get back to you within 24 hours with detailed pricing.</p>
          <p style="margin-top: 20px;">Best regards,<br/>Lotus Gift Team</p>
        </div>
      </div>
    `;
    return this.sendMail(clientEmail, subject, html);
  }

  async sendOrderConfirmation(orderNumber: string, email: string, name: string, total: number) {
    const subject = `Order Confirmed - ${orderNumber}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B7A3E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Lotus Gift</h1>
        </div>
        <div style="padding: 30px; background: #f8fafb;">
          <h2>Order Confirmed!</h2>
          <p>Hello ${name},</p>
          <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
          <p>Total Amount: <strong>₹${total.toLocaleString('en-IN')}</strong></p>
          <p>We will keep you updated on the order status.</p>
          <p style="margin-top: 20px;">Thank you for choosing Lotus Gift!</p>
        </div>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendContactNotification(name: string, email: string, message: string) {
    const adminEmail = this.config.get('SMTP_USER') || 'admin@lotusgift.com';
    const subject = `New Contact Inquiry from ${name}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `;
    return this.sendMail(adminEmail, subject, html);
  }
}
