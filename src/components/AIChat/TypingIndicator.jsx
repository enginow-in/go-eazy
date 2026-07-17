const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></span>
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></span>
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0.4s" }}
        ></span>
      </div>

      <span className="text-xs text-gray-500">
        AI is typing...
      </span>
    </div>
  );
};

export default TypingIndicator;