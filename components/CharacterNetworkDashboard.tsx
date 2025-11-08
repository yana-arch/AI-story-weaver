import React, { useMemo } from 'react';
import { Story } from '../types';
import {
  getAnalyticsService,
  CharacterAnalytics,
  CharacterRelationship,
} from '../services/analyticsService';
import { CheckCircleIcon } from './icons';

interface CharacterNetworkDashboardProps {
  story?: Story;
  className?: string;
}

const getRelationshipTypeColor = (type: CharacterRelationship['type']): string => {
  switch (type) {
    case 'positive':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'negative':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'romantic':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
    case 'neutral':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getRelationshipTypeLabel = (type: CharacterRelationship['type']): string => {
  switch (type) {
    case 'positive':
      return 'Tích cực';
    case 'negative':
      return 'Xung đột';
    case 'romantic':
      return 'Lãng mạn';
    case 'neutral':
      return 'Trung lập';
    default:
      return 'Không xác định';
  }
};

const getTraitColor = (trait: string): string => {
  const positiveTraits = ['khoan dung', 'thông minh', 'kiên trì', 'lạc quan', 'hoạt bát'];
  const negativeTraits = ['hận thù', 'nóng tính', 'keo kiệt', 'thiển cận', 'lười biếng'];

  if (positiveTraits.some((t) => trait.toLowerCase().includes(t))) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  }
  if (negativeTraits.some((t) => trait.toLowerCase().includes(t))) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
};

export const CharacterNetworkDashboard: React.FC<CharacterNetworkDashboardProps> = ({
  story,
  className = '',
}) => {
  const analyticsService = getAnalyticsService();

  const characterAnalytics: CharacterAnalytics[] = useMemo(() => {
    if (!story) return [];
    return analyticsService.getCharacterAnalytics(story);
  }, [story, analyticsService]);

  if (!story || characterAnalytics.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Chưa có nhân vật nào</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tạo profile cho các nhân vật trong truyện để xem mạng lưới mối quan hệ và phân tích nhân
          vật chi tiết.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Mạng lưới nhân vật</h2>
        <p className="text-muted-foreground">Phân tích mối quan hệ và đặc điểm của từng nhân vật</p>
      </div>

      {/* Character Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characterAnalytics.map((character) => (
          <div
            key={character.name}
            className="bg-card rounded-lg p-6 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-1">{character.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="text-xs">💬</span>
                    {character.dialogCount} hội thoại
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-xs">👀</span>
                    {character.appearanceCount}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{character.wordCount}</div>
                <div className="text-xs text-muted-foreground">từ</div>
              </div>
            </div>

            {/* Character Traits */}
            {character.traits.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">Đặc điểm:</h4>
                <div className="flex flex-wrap gap-1">
                  {character.traits.map((trait, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTraitColor(trait)}`}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships */}
            {character.relationships.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">Mối quan hệ:</h4>
                <div className="space-y-2">
                  {character.relationships.map((relationship, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        → {relationship.character}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i <= relationship.strength ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${getRelationshipTypeColor(relationship.type)}`}
                        >
                          {getRelationshipTypeLabel(relationship.type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Character Development Arc */}
            {character.developmentArc.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Quá trình phát triển:</h4>
                <div className="flex items-center gap-2 text-xs">
                  {character.developmentArc.map((stage, index) => (
                    <React.Fragment key={index}>
                      <span
                        className={`px-2 py-1 rounded ${
                          index === 0
                            ? 'bg-blue-100 text-blue-800'
                            : index === character.developmentArc.length - 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {stage}
                      </span>
                      {index < character.developmentArc.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Character Network Visualization */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-lg">🔗</span>
          Mạng lưới mối quan hệ
        </h3>

        <div className="space-y-4">
          {characterAnalytics.map((character) => (
            <div key={character.name} className="flex items-center gap-4">
              <div className="font-medium text-foreground min-w-0 flex-shrink-0">
                {character.name}
              </div>

              <div className="flex-1 flex items-center gap-2">
                {character.relationships.map((rel, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getRelationshipTypeColor(rel.type)}`}
                      >
                        {rel.character}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-1 h-3 rounded-sm ${
                              i <= Math.ceil(rel.strength / 2) ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {index < character.relationships.length - 1 && (
                      <span className="text-muted-foreground text-sm">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 rounded"></div>
              <span>Tích cực</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 dark:bg-red-900/20 rounded"></div>
              <span>Xung đột</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-100 dark:bg-pink-900/20 rounded"></div>
              <span>Lãng mạn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-900/20 rounded"></div>
              <span>Trung lập</span>
            </div>
          </div>
        </div>
      </div>

      {/* Character Focus Distribution */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          Sự hiện diện của nhân vật
        </h3>

        <div className="space-y-3">
          {characterAnalytics
            .sort((a, b) => b.appearanceCount - a.appearanceCount)
            .map((character) => (
              <div key={character.name} className="flex items-center gap-3">
                <div className="min-w-0 flex-shrink-0 w-20">
                  <span className="text-sm font-medium text-foreground">{character.name}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${character.appearanceCount}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                      {character.appearanceCount}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Phân bố sự hiện diện của nhân vật trong câu chuyện
          </p>
        </div>
      </div>
    </div>
  );
};
