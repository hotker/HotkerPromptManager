/**
 * 智能优化服务
 */

export interface AnalysisResult {
    overallScore: number;
    dimensions: {
        clarity: number;
        specificity: number;
        structure: number;
        completeness: number;
    };
    issues: string[];
    suggestions: string[];
}

export interface OptimizationResult {
    original: string;
    optimized: string;
}

export const optimizerService = {
    /**
     * 分析提示词质量
     */
    async analyzePrompt(prompt: string, apiKey: string): Promise<AnalysisResult | null> {
        try {
            const res = await fetch('/api/optimize/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, apiKey })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Analysis failed');
            }

            return await res.json();
        } catch (error) {
            console.error('Analyze prompt error:', error);
            throw error;
        }
    },

    /**
     * 优化提示词
     */
    async improvePrompt(prompt: string, apiKey: string): Promise<OptimizationResult | null> {
        try {
            const res = await fetch('/api/optimize/improve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, apiKey })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Optimization failed');
            }

            return await res.json();
        } catch (error) {
            console.error('Improve prompt error:', error);
            throw error;
        }
    }
};
