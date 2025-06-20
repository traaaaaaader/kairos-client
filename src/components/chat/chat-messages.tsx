import { Fragment, useRef, ElementRef } from "react";
import { format } from "date-fns";
import { Message, User } from "@/utils/types/chat";
import { Member } from "@/utils/types/servers";
import { Loader2, ServerCrash } from "lucide-react";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";
import { useChatScroll } from "@/hooks/use-chat-scroll";

const DATE_FORMAT = "dd.MM.yyyy, HH:mm";

type MessageWithMemberWithUser = Message & {
  member: Member & {
    user: User;
  };
};

interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  socketQuery: Record<string, any>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "channel" | "conversation";
}

export const ChatMessages = ({
  name,
  member,
  chatId,
  socketQuery,
  paramKey,
  paramValue,
  type,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      paramKey,
      paramValue,
    });

  useChatSocket({ queryKey, addKey, updateKey });

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-foreground animate-spin my-4" />
        <p className="text-xs text-foreground">Loading messages...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-xs text-foreground">Something went wrong!</p>
      </div>
    );
  }

  return (
    <div
      ref={chatRef}
      className="flex flex-col flex-1 py-4 overflow-y-auto scrollbar"
    >
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && <ChatWelcome type={type} name={name} />}
      {hasNextPage && (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="h-6 w-6 text-foreground animate-spin my-4" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-muted-foreground hover:text-foreground text-xs my-4 transition"
            >
              Load previous messages
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((group, i) => (
          <Fragment key={i}>
            {group.items.map((message: MessageWithMemberWithUser) => (
              <ChatItem
                key={message.id}
                member={message.member}
                currentMember={member}
                id={message.id}
                content={message.content}
                fileUrl={message.fileUrl}
                deleted={message.deleted}
                timestap={format(new Date(message.createdAt), DATE_FORMAT)}
                isUpdated={message.updatedAt !== message.createdAt}
                socketQuery={socketQuery}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
