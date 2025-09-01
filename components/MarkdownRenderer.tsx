import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

/**
 * A simple component to render basic markdown-like syntax.
 * - Converts blocks of lines starting with '- ' or '* ' into an unordered list.
 * - Renders other blocks of text as paragraphs, preserving line breaks.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    if (!content) return null;

    // Split the content into blocks separated by one or more empty lines.
    const blocks = content.split(/\n\s*\n/);

    return (
        <>
            {blocks.map((block, index) => {
                const trimmedBlock = block.trim();
                if (!trimmedBlock) return null;

                const lines = trimmedBlock.split('\n');
                // Check if every line in the block looks like a list item.
                const isList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));

                if (isList) {
                    return (
                        <ul key={index} className="list-disc list-inside my-4">
                            {lines.map((line, lineIndex) => (
                                <li key={lineIndex}>{line.trim().substring(2).trim()}</li>
                            ))}
                        </ul>
                    );
                } else {
                    // Render as a paragraph, preserving internal newlines.
                    return <p key={index} className="whitespace-pre-wrap">{block}</p>;
                }
            })}
        </>
    );
};
