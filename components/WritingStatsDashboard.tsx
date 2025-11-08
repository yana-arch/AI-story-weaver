import React, { useMemo } from 'react';
import { Story } from '../types';
import { getAnalyticsService, WritingStats } from '../services/analyticsService';
import { CheckCircleIcon, ExclamationCircleIcon } from './icons';

interface WritingStatsDashboardProps {
  story?: Story;
  className?: string;
}

export const WritingStatsDashboard: React.FC<WritingStatsDashboardProps> = ({
  story,
  className = '',
}) => {
  const analyticsService = getAnalyticsService();

  const stats: WritingStats = useMemo(() => {
    return analyticsService.getWritingStats(story);
  }, [story, analyticsService]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  };

  const formatLastActivity = (timestamp: number): string => {
    if (timestamp === 0) return 'Chưa viết gì';

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return 'Mới đây';
    if (diffHours < 24) return `${Math.floor(diffHours)} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return 'Tuần trước';
    if (diffWeeks < 4) return `${diffWeeks} tuần trước`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return 'Tháng trước';
    return `${diffMonths} tháng trước`;
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return 'Nửa đêm';
    if (hour < 12) return `${hour} giờ sáng`;
    if (hour === 12) return 'Trưa';
    if (hour < 18) return `${hour - 12} giờ chiều`;
    return `${hour - 12} giờ tối`;
  };

  const getProductivityLevel = (
    wordsPerHour: number
  ): { level: string; color: string; icon: string } => {
    if (wordsPerHour >= 1000)
      return { level: 'Siêu năng suất', color: 'text-purple-600', icon: '🚀' };
    if (wordsPerHour >= 500) return { level: 'Năng suất cao', color: 'text-blue-600', icon: '💙' };
    if (wordsPerHour >= 200) return { level: 'Năng suất中等', color: 'text-green-600', icon: '✅' };
    if (wordsPerHour >= 50) return { level: 'Bắt đầu tốt', color: 'text-yellow-600', icon: '🌱' };
    return { level: 'Đang học hỏi', color: 'text-gray-600', icon: '📚' };
  };

  const productivity = getProductivityLevel(stats.wordsPerHour);

  const statCards = [
    {
      icon: <span className="text-xl">📚</span>,
      title: 'Tổng số từ',
      value: stats.totalWords.toLocaleString(),
      subtitle: 'đã viết',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      icon: <span className="text-xl">⚡</span>,
      title: 'Từ/zgiờ',
      value: Math.round(stats.wordsPerHour).toLocaleString(),
      subtitle: `${productivity.icon} ${productivity.level}`,
      color: productivity.color,
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      icon: <span className="text-xl">⏰</span>,
      title: 'Thời gian viết',
      value: formatDuration(stats.totalWritingTime),
      subtitle: `${stats.sessionsCount} phiên làm việc`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      icon: <span className="text-xl">📅</span>,
      title: 'Chuỗi ngày',
      value: stats.streakDays.toString(),
      subtitle: stats.streakDays === 1 ? 'ngày liên tiếp' : 'ngày liên tiếp',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Thống kê viết truyện</h2>
        <p className="text-muted-foreground">Theo dõi tiến độ và hiệu suất viết của bạn</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg p-4 border transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`${card.color} p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-lg">📈</span>
            Chi tiết hiệu suất
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Số phiên làm việc:</span>
              <span className="font-medium">{stats.sessionsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Thời gian trung bình mỗi phiên:</span>
              <span className="font-medium">{formatDuration(stats.averageSessionDuration)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Giờ viết yêu thích:</span>
              <span className="font-medium">{formatHour(stats.favoriteWritingHour)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hoạt động cuối:</span>
              <span className="font-medium">{formatLastActivity(stats.lastActivity)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-semibold text-foreground mb-3">Mục tiêu hằng ngày</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Từ/ngày (500 từ)</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min((stats.totalWords / stats.streakDays / 500) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {stats.streakDays > 0 ? Math.round(stats.totalWords / stats.streakDays) : 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Phiên/tháng (12 phiên)</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((stats.sessionsCount / 12) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{stats.sessionsCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Thời gian/tháng (20h)</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min((stats.totalWritingTime / 60 / 20) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {Math.round(stats.totalWritingTime / 60)}h
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Tiếp tục phát huy phong độ! 🎯
            </p>
          </div>
        </div>
      </div>

      {stats.totalWords === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <span className="text-4xl mx-auto mb-3 opacity-50" role="img" aria-label="sách">
            📖
          </span>
          <h3 className="font-medium mb-2">Bắt đầu hành trình viết của bạn</h3>
          <p className="text-sm">Thống kê của bạn sẽ xuất hiện ở đây sau những dòng đầu tiên</p>
        </div>
      )}
    </div>
  );
};
