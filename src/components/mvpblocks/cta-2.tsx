// import {} from "react";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

interface Props {
  title: {
    level: 1 | 2 | 3 | 4 | 5 | 6 | 'normal';
    text: string;
    props?: React.HTMLAttributes<HTMLElement>;
  };
  description: React.ReactNode;
  ctaArea?: React.ReactNode;
}

export default function CTA2({ title, description, ctaArea }: Props) {
  const HeadingTag: ElementType =
    title.level === 'normal'
      ? 'div'
      : `h${title.level}`;

  const { className, ...restProps } = title.props || {};

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-green-700 p-6 sm:p-10 md:p-20">
      <div className="absolute inset-0 hidden h-full w-full overflow-hidden md:block">
        <div className="absolute top-1/2 right-[-32%] aspect-square h-[800px] w-[800px] -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-30"></div>
          <div className="absolute inset-0 scale-[0.8] rounded-full bg-green-300 opacity-30"></div>
          <div className="absolute inset-0 scale-[0.6] rounded-full bg-green-200 opacity-30"></div>
          <div className="absolute inset-0 scale-[0.4] rounded-full bg-green-100 opacity-30"></div>
          <div className="absolute inset-0 scale-[0.2] rounded-full bg-green-50 opacity-30"></div>
          <div className="absolute inset-0 scale-[0.1] rounded-full bg-white/50 opacity-30"></div>
        </div>
      </div>

      <div className="relative z-10">
        <HeadingTag
          className={cn(
            'mb-3 text-3xl font-bold text-white sm:text-4xl md:mb-4 md:text-5xl text-pretty',
            className
          )}
          {...restProps}
        >
          {title.text}
        </HeadingTag>
        <div className="mb-6 max-w-prose text-pretty text-base text-white sm:text-lg md:mb-8">
          {description}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          {ctaArea}
        </div>
      </div>
    </div>
  );
}
