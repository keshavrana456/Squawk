import { Link } from "wouter";

interface RichTextProps {
  text: string;
  className?: string;
}

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;
const IMAGE_ONLY_PATTERN = /^https?:\/\/\S+\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i;

export default function RichText({ text, className }: RichTextProps) {
  if (IMAGE_ONLY_PATTERN.test(text.trim())) {
    return (
      <img
        src={text.trim()}
        alt="image"
        className="max-w-[180px] max-h-[140px] rounded-xl object-cover mt-1"
        loading="lazy"
      />
    );
  }

  const parts = text.split(/(https?:\/\/[^\s<>"']+|#[\w]+|@[\w]+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:opacity-80 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        if (/^#[\w]+$/.test(part)) {
          return (
            <Link
              key={i}
              href={`/explore/hashtags/${part.slice(1)}`}
              className="text-primary font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (/^@[\w]+$/.test(part)) {
          return (
            <Link
              key={i}
              href={`/profile/${part.slice(1)}`}
              className="text-primary font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
