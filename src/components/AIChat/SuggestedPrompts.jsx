const prompts = [
  "2 BHK under ₹40 lakh",
  "Apartments in Dehradun",
  "Show furnished homes",
  "Best investment property",
];

const SuggestedPrompts = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 p-3">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-full bg-gray-100 px-3 py-2 text-xs hover:bg-[#CA3433] hover:text-white transition"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;