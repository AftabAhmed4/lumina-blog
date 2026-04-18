import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
    />
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 space-y-12 transition-colors duration-300">
      <div className="space-y-8">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="aspect-[21/9] w-full rounded-[60px]" />
      <div className="space-y-6 pt-12">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-bg space-y-6">
      <Skeleton className="aspect-[16/10] w-full rounded-[24px]" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <div className="flex items-center space-x-4 pt-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
