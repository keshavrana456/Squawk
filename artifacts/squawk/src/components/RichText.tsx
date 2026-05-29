import { Link } from "wouter";

interface RichTextProps {
  text: string;
  className?: string;
}

export default function RichText({ text, className }: RichTextProps) {
  const imageUrlPattern = /^https?:\/\/\S+\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i;
  if (imageUrlPattern.test(text.trim())) {
    return (
      <img
        src={text.trim()}
        alt="image"
        className="max-w-[180px] max-h-[140px] rounded-xl object-cover mt-1"
        loading="lazy"
      />
    );
  }

  const parts = text.split(/(#[\w]+|@[\w]+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
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
