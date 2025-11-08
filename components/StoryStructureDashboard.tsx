import React, { useMemo } from 'react';
import { Story } from '../types';
import { getAnalyticsService, StoryStructureAnalytics } from '../services/analyticsService';

interface StoryStructureDashboardProps {
  story?: Story;
  className?: string;
}

export const StoryStructureDashboard: React.FC<StoryStructureDashboardProps> = ({
  story,
  className = '',
}) => {
  const analyticsService = getAnalyticsService();

  const structureAnalytics: StoryStructureAnalytics = useMemo(() => {
    if (!story)
      return {
        chapterCount: 0,
        sceneCount: 0,
        actStructure: { act1Percentage: 0, act2Percentage: 0, act3Percentage: 0 },
        tensionCurve: [],
        pacingMetrics: { slowSections: 0, mediumSections: 0, fastSections: 0 },
        characterPresence: {},
      };
    return analyticsService.getStoryStructureAnalytics(story);
  }, [story, analyticsService]);

  if (!story) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Chưa có dữ liệu cấu trúc câu chuyện
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Bắt đầu viết truyện để xem phân tích cấu trúc và nhịp độ câu chuyện.
        </p>
      </div>
    );
  }

  const totalScenes =
    structureAnalytics.pacingMetrics.slowSections +
    structureAnalytics.pacingMetrics.mediumSections +
    structureAnalytics.pacingMetrics.fastSections;
  const slowPercentage =
    totalScenes > 0
      ? Math.round((structureAnalytics.pacingMetrics.slowSections / totalScenes) * 100)
      : 0;
  const mediumPercentage =
    totalScenes > 0
      ? Math.round((structureAnalytics.pacingMetrics.mediumSections / totalScenes) * 100)
      : 0;
  const fastPercentage =
    totalScenes > 0
      ? Math.round((structureAnalytics.pacingMetrics.fastSections / totalScenes) * 100)
      : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Cấu trúc câu chuyện</h2>
        <p className="text-muted-foreground">
          Phân tích cấu trúc, nhịp độ và sự phát triển của câu chuyện
        </p>
      </div>

      {/* Basic Structure Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📖</div>
          <div className="text-2xl font-bold text-primary">{structureAnalytics.chapterCount}</div>
          <div className="text-sm text-muted-foreground">Chương</div>
        </div>

        <div className="bg-card rounded-lg p-4 border text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">🎭</div>
          <div className="text-2xl font-bold text-blue-600">{structureAnalytics.sceneCount}</div>
          <div className="text-sm text-muted-foreground">Cảnh</div>
        </div>

        <div className="bg-card rounded-lg p-4 border text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-2xl font-bold text-green-600">
            {Math.round(structureAnalytics.tensionCurve.length / 10)}
          </div>
          <div className="text-sm text-muted-foreground">Điểm cao trào</div>
        </div>

        <div className="bg-card rounded-lg p-4 border text-center hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">⏱️</div>
          <div className="text-2xl font-bold text-purple-600">{totalScenes}</div>
          <div className="text-sm text-muted-foreground">Đoạn văn</div>
        </div>
      </div>

      {/* Act Structure */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-lg">🎬</span>
          Cấu trúc hồi (3 hồi kinh điển)
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-shrink-0 w-20">
              <span className="text-sm font-medium text-blue-600">Hồi 1: Setup</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${structureAnalytics.actStructure.act1Percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[3rem] text-right text-blue-600">
                  {structureAnalytics.actStructure.act1Percentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Giới thiệu nhân vật, bối cảnh và xung đột ban đầu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-shrink-0 w-20">
              <span className="text-sm font-medium text-orange-600">Hồi 2: Confrontation</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${structureAnalytics.actStructure.act2Percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[3rem] text-right text-orange-600">
                  {structureAnalytics.actStructure.act2Percentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Phát triển xung đột, thử thách và phát triển nhân vật
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-shrink-0 w-20">
              <span className="text-sm font-medium text-green-600">Hồi 3: Resolution</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${structureAnalytics.actStructure.act3Percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[3rem] text-right text-green-600">
                  {structureAnalytics.actStructure.act3Percentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Đỉnh điểm và giải quyết xung đột</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pacing Analysis */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          Phân tích nhịp độ
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2 text-blue-500">🐌</div>
              <div className="text-2xl font-bold text-blue-600">{slowPercentage}%</div>
              <div className="text-sm text-muted-foreground">
                Chậm ({structureAnalytics.pacingMetrics.slowSections})
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mô tả chi tiết, xây dựng không khí
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-2 text-yellow-500">🏃</div>
              <div className="text-2xl font-bold text-yellow-600">{mediumPercentage}%</div>
              <div className="text-sm text-muted-foreground">
                Trung bình ({structureAnalytics.pacingMetrics.mediumSections})
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cân bằng hành động và cảm xúc</p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-2 text-red-500">🚀</div>
              <div className="text-2xl font-bold text-red-600">{fastPercentage}%</div>
              <div className="text-sm text-muted-foreground">
                Nhanh ({structureAnalytics.pacingMetrics.fastSections})
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hành động dồn dập, kịch tính cao</p>
            </div>
          </div>

          {totalScenes > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <span>Nhịp độ lý tưởng cho thể loại này:</span>
                <span className="font-medium text-foreground">
                  {slowPercentage > 40
                    ? 'Tạp văn'
                    : mediumPercentage > 50
                      ? 'Văn xuôi hiện đại'
                      : 'Tiểu thuyết phiêu lưu'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tension Curve */}
      {structureAnalytics.tensionCurve.length > 0 && (
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="text-lg">📊</span>
            Đồ thị căng thẳng
          </h3>

          <div className="h-32 flex items-end gap-1">
            {structureAnalytics.tensionCurve.slice(0, 50).map((point, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-red-400 to-yellow-400 rounded-sm flex-1 min-w-[2px] transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(3, point.tension)}%`,
                  opacity: point.tension / 10 + 0.3,
                }}
                title={`Vị trí: ${point.position.toFixed(1)}% - Căng thẳng: ${point.tension.toFixed(1)}`}
              />
            ))}
          </div>

          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Bắt đầu</span>
            <span>...</span>
            <span>Kết thúc</span>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Đường cong căng thẳng dựa trên phân tích nội dung câu chuyện
            </p>
          </div>
        </div>
      )}

      {/* Character Focus in Structure */}
      {Object.keys(structureAnalytics.characterPresence).length > 0 && (
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="text-lg">🎯</span>
            Sự hiện diện nhân vật qua câu chuyện
          </h3>

          <div className="space-y-3">
            {Object.entries(structureAnalytics.characterPresence)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([characterName, percentage]) => (
                <div key={characterName} className="flex items-center gap-3">
                  <div className="min-w-0 flex-shrink-0 w-24">
                    <span className="text-sm font-medium text-foreground truncate">
                      {characterName}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage > 30
                              ? 'bg-red-400'
                              : percentage > 15
                                ? 'bg-yellow-400'
                                : percentage > 5
                                  ? 'bg-blue-400'
                                  : 'bg-gray-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded"></div>
                <span>Nhân vật chính</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded"></div>
                <span>Nhân vật phụ</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded"></div>
                <span>Hỗ trợ</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded"></div>
                <span>Xuất hiện ít</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
