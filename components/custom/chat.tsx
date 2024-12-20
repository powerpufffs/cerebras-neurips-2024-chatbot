'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useMemo, useState } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';

import { UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  arxivId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  arxivId?: string;
}) {
  const data = null;

  const suggestedQuestions = useMemo(() => {
    return data ? JSON.parse(data).suggestions : null;
  }, [data]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
  } = useChat({
    body: {
      id,
      modelId: selectedModelId,
      arxivId: arxivId,
    },
    initialMessages,
  });

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-full relative">
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto px-4 pt-8 scrollbar-thin scrollbar-thumb-secondary"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              message={message}
              block={block}
              setBlock={setBlock}
              isLoading={isLoading && messages.length - 1 === index}
              vote={undefined}
            />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm pt-2 px-4">
          <form className="flex mx-auto bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              overrideSuggestedQuestions={suggestedQuestions}
            />
          </form>
        </div>
      </div>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
