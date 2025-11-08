import React, { useState } from 'react';
import {
  AIModelConfig,
  AIProvider,
  getAvailableModelsByCapability,
  AIModelCapability,
} from '../types/ai-models';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { CheckCircleIcon, ExclamationCircleIcon } from './icons';

interface AIModelSelectorProps {
  selectedModelId?: string;
  onModelSelect: (modelId: string) => void;
  availableModels?: AIModelConfig[];
  capability?: AIModelCapability;
  showCost?: boolean;
  testConnection?: boolean;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModelId,
  onModelSelect,
  availableModels,
  capability = AIModelCapability.STORY_CONTINUATION,
  showCost = true,
  testConnection = false,
}) => {
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { addError } = useErrorHandler();

  const models = availableModels || getAvailableModelsByCapability(capability);

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
  };

  const handleTestConnection = async (model: AIModelConfig) => {
    setTestingModel(model.modelId);

    try {
      // TODO: Implement actual connection testing through AIService
      // For now, just simulate a test
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResults((prev) => ({ ...prev, [model.modelId]: success }));

      if (!success) {
        addError(`Không thể kết nối đến ${model.name}`, {
          context: 'Model Testing',
          recoverable: true,
        });
      }
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [model.modelId]: false }));
      addError(`Lỗi khi test kết nối ${model.name}`, {
        context: 'Model Testing',
        recoverable: true,
      });
    } finally {
      setTestingModel(null);
    }
  };

  const formatProviderName = (provider: AIProvider): string => {
    switch (provider) {
      case AIProvider.GOOGLE:
        return 'Google';
      case AIProvider.OPENAI:
        return 'OpenAI';
      case AIProvider.ANTHROPIC:
        return 'Anthropic';
      default:
        return provider;
    }
  };

  const formatCost = (costPerToken?: number): string => {
    if (!costPerToken) return 'Miễn phí';
    return `$${costPerToken.toFixed(4)}/1K tokens`;
  };

  const getModelRecommendations = () => {
    const recommendations = [];

    if (capability === AIModelCapability.STORY_CONTINUATION) {
      recommendations.push(
        'Gemini Flash: Nhanh và hiệu quả cho việc viết truyện',
        'Claude Sonnet: Xuất sắc trong việc viết truyện sáng tạo',
        'GPT-4: Tốt cho các tác phẩm phức tạp có độ dài'
      );
    }

    return recommendations;
  };

  if (models.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ExclamationCircleIcon className="w-8 h-8 mx-auto mb-2" />
        <p>Không có model AI nào khả dụng cho chức năng này</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {getModelRecommendations().length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            Khuyến nghị
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {getModelRecommendations().map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {models.map((model) => {
          const isSelected = selectedModelId === model.modelId;
          const testResult = testResults[model.modelId];
          const isTesting = testingModel === model.modelId;

          return (
            <label
              key={model.modelId}
              className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="ai-model"
                  value={model.modelId}
                  checked={isSelected}
                  onChange={() => handleModelSelect(model.modelId)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground">{model.name}</h3>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
                        {formatProviderName(model.provider)}
                      </span>

                      {testConnection && testResult !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                            testResult
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {testResult ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3" />
                              OK
                            </>
                          ) : (
                            <>
                              <ExclamationCircleIcon className="w-3 h-3" />
                              Lỗi
                            </>
                          )}
                        </span>
                      )}

                      {isSelected && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs">
                          Đang dùng
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {model.capabilities.join(', ')} • Context:{' '}
                    {model.contextWindow.toLocaleString()} tokens
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {showCost && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-xs">💰</span>
                          {formatCost(model.costPerToken)}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Tối đa {model.maxRequestsPerMinute || 'N/A'} requests/phút
                      </div>
                    </div>

                    {testConnection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleTestConnection(model);
                        }}
                        disabled={isTesting}
                        className="px-3 py-1 text-xs border border-border rounded hover:bg-accent disabled:opacity-50 flex items-center gap-1"
                      >
                        {isTesting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Đang test...
                          </>
                        ) : (
                          'Test kết nối'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
