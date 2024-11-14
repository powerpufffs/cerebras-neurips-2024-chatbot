import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Text2SVG from 'react-hook-mathjax';

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const renderLatexInText = (text: string) => {
    if (typeof text !== 'string') return text;
    
    const parts = text.split(/(\$[^\$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const latex = part.slice(1, -1);
        return (
          <span 
            key={i} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'baseline', 
              verticalAlign: 'baseline'
            }}
          >
            <Text2SVG display="inline" latex={latex} />
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const withLatexSupport = (Component: any, className: string) => {
    return ({ node, children, ...props }: any) => (
      <Component className={className} {...props}>
        {React.Children.map(children, child =>
          typeof child === 'string' ? renderLatexInText(child) : child
        )}
      </Component>
    );
  };

  const components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-sm w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100 p-3 rounded-lg mt-2 dark:bg-zinc-800`}
        >
          <code className={match[1]}>
            {React.Children.map(children, child =>
              typeof child === 'string' ? renderLatexInText(child) : child
            )}
          </code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
          {...props}
        >
          {React.Children.map(children, child =>
            typeof child === 'string' ? renderLatexInText(child) : child
          )}
        </code>
      );
    },
    p: withLatexSupport('p', ''),
    strong: withLatexSupport('span', 'font-semibold'),
    em: withLatexSupport('em', ''),
    h1: withLatexSupport('h1', 'text-3xl font-semibold mt-6 mb-2'),
    h2: withLatexSupport('h2', 'text-2xl font-semibold mt-6 mb-2'),
    h3: withLatexSupport('h3', 'text-xl font-semibold mt-6 mb-2'),
    h4: withLatexSupport('h4', 'text-lg font-semibold mt-6 mb-2'),
    h5: withLatexSupport('h5', 'text-base font-semibold mt-6 mb-2'),
    h6: withLatexSupport('h6', 'text-sm font-semibold mt-6 mb-2'),
    li: withLatexSupport('li', 'py-1'),
    a: ({ node, children, ...props }: any) => (
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {React.Children.map(children, child =>
          typeof child === 'string' ? renderLatexInText(child) : child
        )}
      </Link>
    ),
    ol: ({ node, children, ...props }: any) => (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    ),
    ul: ({ node, children, ...props }: any) => (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
