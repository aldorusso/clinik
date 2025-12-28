/**
 * Notification endpoints
 */

import { API_URL } from '../client';
import type { Notification, NotificationListResponse, NotificationCountResponse } from '../types';

export const notificationEndpoints = {
  async getNotifications(
    token: string,
    params?: {
      skip?: number;
      limit?: number;
      unread_only?: boolean;
    }
  ): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unread_only) searchParams.append('unread_only', 'true');

    const url = `${API_URL}/api/v1/notifications${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  async getNotificationCount(token: string): Promise<NotificationCountResponse> {
    const response = await fetch(`${API_URL}/api/v1/notifications/count`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification count');
    }

    return response.json();
  },

  async markNotificationAsRead(token: string, notificationId: string): Promise<Notification> {
    const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  },

  async markAllNotificationsAsRead(token: string): Promise<{ message: string; count: number }> {
    const response = await fetch(`${API_URL}/api/v1/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  },

  async deleteNotification(token: string, notificationId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return response.json();
  },
};
