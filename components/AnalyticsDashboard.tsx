import React, { useState } from 'react';
import { Story } from '../types';
import { WritingStatsDashboard } from './WritingStatsDashboard';
import { CharacterNetworkDashboard } from './CharacterNetworkDashboard';
import { StoryStructureDashboard } from './StoryStructureDashboard';
import { BookOpenIcon } from './icons';

interface AnalyticsDashboardProps {
  story?: Story;
  className?: string;
}

type AnalyticsTab = 'writing' | 'characters' | 'structure';

interface TabConfig {
  id: AnalyticsTab;
  title: string;
  icon: React.ReactNode;
  description: string;
  component: React.ComponentType<{ story?: Story; className?: string }>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  story,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('writing');

  const tabs: TabConfig[] = [
    {
      id: 'writing',
      title: 'Viết truyện',
      icon: <span className="text-xs">📊</span>,
      description: 'Theo dõi tiến độ và hiệu suất viết',
      component: WritingStatsDashboard,
    },
    {
      id: 'characters',
      title: 'Nhân vật',
      icon: <span className="text-xs">👥</span>,
      description: 'Mạng lưới và mối quan hệ nhân vật',
      component: CharacterNetworkDashboard,
    },
    {
      id: 'structure',
      title: 'Cấu trúc',
      icon: <BookOpenIcon className="w-4 h-4" />,
      description: 'Phân tích cấu trúc và nhịp độ truyện',
      component: StoryStructureDashboard,
    },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || WritingStatsDashboard;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center border-b pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">📈</span>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Phân tích chi tiết hành trình viết của bạn. Theo dõi tiến độ, phân tích nhân vật, và hiểu
          sâu hơn về cấu trúc câu chuyện.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 min-w-0 justify-center ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.title}</span>
              <span className="sm:hidden">{tab.title.slice(0, 4)}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Description */}
      <div className="text-center py-2 border-b">
        <p className="text-sm text-muted-foreground">
          {tabs.find((tab) => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1">
        <ActiveComponent story={story} />
      </div>

      {/* Quick Stats Summary */}
      {story && (
        <div className="bg-card rounded-lg p-4 border mt-8">
          <h3 className="font-semibold text-foreground mb-4 text-center">Tóm tắt nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{story.storySegments.length}</div>
              <div className="text-xs text-muted-foreground">Đoạn truyện</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {story.storySegments
                  .reduce((acc, seg) => acc + seg.content.split(/\s+/).length, 0)
                  .toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Tổng từ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {story.characterProfiles?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Nhân vật</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Date(story.updatedAt).toLocaleDateString('vi-VN')}
              </div>
              <div className="text-xs text-muted-foreground">Cập nhật cuối</div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Mẹo phân tích
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Theo dõi số từ hàng ngày để duy trì thói quen viết</li>
          <li>• Cân bằng thời gian giữa phát triển nhân vật và cốt truyện</li>
          <li>• Đảm bảo cấu trúc 3 hồi cân đối để câu chuyện hấp dẫn</li>
          <li>• Sử dụng nhịp độ linh hoạt để giữ chân người đọc</li>
        </ul>
      </div>
    </div>
  );
};
