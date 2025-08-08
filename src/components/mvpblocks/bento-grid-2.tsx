'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { LinkPreview } from "@/components/ui/link-preview";
import type { LinkPreviewProps } from "@/components/ui/link-preview";

interface BentoActionProps {
  url?: string;
  urlText?: string;
  urlPreview?: Omit<LinkPreviewProps, "url">;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: BentoActionProps;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
}

const renderCTA = (cta: BentoActionProps | undefined) => {
  if (!cta) return null;

  // If it's an action object
  const handleClick = (e: React.MouseEvent) => {
    if (cta.onClick) {
      e.preventDefault();
      cta.onClick();
    }
  };

  // If it has urlPreview, use LinkPreview
  if (cta.urlPreview && cta.url) {
    return cta.urlPreview.isStatic ? (
      <LinkPreview
        url={cta.url}
        isStatic={true}
        imageSrc={cta.urlPreview.imageSrc!}
        className={cn(
          "text-primary text-[calc(0.65em+0.2cqw)] font-medium opacity-75 transition-opacity group-hover:opacity-100 flex items-center",
          cta.urlPreview.className
        )}
      >
        {cta.urlPreview.children ? (
          <div className="flex items-end text-nowrap">
            {cta.urlPreview.children}
            {cta.icon && <cta.icon className="ml-1 size-3 transition ease-in-out delay-50 group-hover:translate-x-2" />}
          </div>
        ) : (
          <>
            <span className="mr-1">{cta.urlText || 'Explore'}</span>
            {cta.icon && <cta.icon className="size-3 transition ease-in-out delay-50 group-hover:translate-x-2" />}
          </>
        )}
      </LinkPreview>
    ) : (
      <LinkPreview
        url={cta.url}
        className={cn(
          "text-primary text-[calc(0.65em+0.2cqw)] font-medium opacity-75 transition-opacity group-hover:opacity-100 flex items-center",
          cta.urlPreview.className
        )}
        width={cta.urlPreview.width}
        height={cta.urlPreview.height}
        quality={cta.urlPreview.quality}
        layout={cta.urlPreview.layout}
      >
        {cta.urlPreview.children ? (
          <div className="flex items-center text-nowrap">
            {cta.urlPreview.children}
            {cta.icon && <cta.icon className="ml-1 size-3 transition ease-in-out delay-50 group-hover:translate-x-2" />}
          </div>
        ) : (
          <>
            <span className="mr-1">{cta.urlText || 'Explore'}</span>
            {cta.icon && <cta.icon className="size-3 transition ease-in-out delay-50 group-hover:translate-x-2" />}
          </>
        )}
      </LinkPreview>
    );
  }

  // If it has url but no preview, render as link
  if (cta.url) {
    return (
      <a
        href={cta.url}
        onClick={handleClick}
        className="text-primary text-sm font-medium opacity-75 transition-opacity group-hover:opacity-100 flex items-center ease-in-out delay-50 group-hover:translate-x-2"
      >
        <span className="mr-1">{cta.urlText || 'Explore'}</span>
        {cta.icon && <cta.icon className="size-3" />}
      </a>
    );
  }

  // If it only has onClick, render as button
  if (cta.onClick) {
    return (
      <button
        onClick={handleClick}
        className="text-primary text-sm font-medium opacity-75 transition-opacity group-hover:opacity-100 flex items-center"
      >
        <span className="mr-1">{cta.urlText || 'Explore'}</span>
        {cta.icon && <cta.icon className="size-3 transition ease-in-out delay-50 group-hover:translate-x-2" />}
      </button>
    );
  }

  return null;
};

export default function BentoGrid({ items }: BentoGridProps) {
  return (
    <section className="relative overflow-clip py-12 pointer-events-auto" style={{ overflowClipMargin: "3rem" }}>
      {/* Decorative elements */}
      <div className="bg-primary/5 absolute top-20 -left-20 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-primary/5 absolute -right-20 bottom-20 h-64 w-64 rounded-full blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-3">
        {items.map((item, index) => (
          <motion.div
            key={`${item.title}-${item.status || item.meta}`}
            className={cn(
              item.colSpan || 'col-span-1',
              item.colSpan === 2 ? 'md:col-span-2' : '',
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                'group bg-card/40 relative h-full transition-all duration-300 hover:shadow-md',
                'will-change-transform hover:-translate-y-1',
                'border-border/60 ',
                {
                  '-translate-y-1 shadow-md': item.hasPersistentHover,
                },
              )}
            >
              <div
                className={cn(
                  'absolute inset-0',
                  item.hasPersistentHover
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-300',
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:4px_4px] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
              </div>

              <CardHeader className="relative space-y-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                    {item.icon}
                  </div>
                  {item.status && (
                    <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs font-medium">
                      {item.status || 'Active'}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative space-y-2 p-4 pt-0">
                <h3 className="text-foreground ttext-lg md:text-xl font-medium tracking-tight text-pretty">
                  {item.title}
                  {item.meta && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      {item.meta}
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  {item.description}
                </p>
              </CardContent>

              <CardFooter className="relative p-4 mt-auto">
                <div className="flex w-full items-end-safe justify-between gap-3">
                  <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                    {item.tags?.map((tag) => (
                      <span
                        key={`${item.title}-${tag}`}
                        className="bg-secondary/50 rounded-md px-2 py-1 backdrop-blur-xs transition-all duration-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {renderCTA(item.cta)}
                </div>
              </CardFooter>

              <div
                className={cn(
                  'via-primary/10 absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent to-transparent p-px',
                  item.hasPersistentHover
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-300',
                )}
              />
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
