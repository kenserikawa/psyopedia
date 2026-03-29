interface OperationBodyProps {
  content: string;
}

export function OperationBody({ content }: OperationBodyProps) {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="my-3 ml-6 list-disc space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const key = `line-${index}`;

    if (line.startsWith("## ")) {
      flushList(`flush-${index}`);
      elements.push(
        <h2
          key={key}
          className="mt-6 mb-2 text-xl font-semibold tracking-tight"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(
        <li key={key} className="text-base leading-relaxed text-foreground">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      flushList(`flush-${index}`);
      // skip empty lines
    } else {
      flushList(`flush-${index}`);
      elements.push(
        <p key={key} className="my-3 text-base leading-relaxed text-foreground">
          {line}
        </p>
      );
    }
  });

  // flush any remaining list items
  flushList("flush-end");

  return <div className="prose-custom">{elements}</div>;
}
