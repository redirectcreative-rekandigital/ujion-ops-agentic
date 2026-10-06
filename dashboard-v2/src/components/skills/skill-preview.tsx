import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export function SkillPreview({ content, name }: { content: string; name: string }) {
  return (
    <div className="rounded-lg border p-4 prose-sm max-w-none dark:prose-invert">
      <p className="text-xs text-muted-foreground mb-2">Skill: {name || "(tanpa nama)"}</p>
      <div className="[&>*>:first-child]:mt-0 [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_table]:text-xs">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content || "*Pratinjau kosong — tulis markdown di editor.*"}
        </ReactMarkdown>
      </div>
    </div>
  );
}
