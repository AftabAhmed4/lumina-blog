import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, User, Clock, ChevronRight, MessageSquare, Heart } from 'lucide-react';
import { Post } from '../types';
import { formatDate, estimateReadingTime, cleanURL } from '../lib/utils';

interface PostCardProps {
  post: Post;
  index?: number;
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const readingTime = estimateReadingTime(post.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group bg-bg flex flex-col h-full overflow-hidden"
    >
      <Link to={`/post/${post.id}`} className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-accent mb-6 block">
        <img
          src={cleanURL(post.imageURL) || 'https://picsum.photos/seed/blog/800/600'}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 group-hover:rotate-1"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
            {post.category || 'Article'}
          </span>
        </div>
      </Link>

      <div className="flex flex-col flex-grow">
        <Link to={`/post/${post.id}`} className="block mb-4">
          <h3 className="text-xl font-serif font-bold text-text-main leading-[1.2] group-hover:italic transition-all duration-300 line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-text-sub text-sm leading-relaxed line-clamp-3 mb-6 flex-grow font-medium">
          {post.content.replace(/[#*`]/g, '').slice(0, 140)}...
        </p>

        <div className="flex items-center gap-4 pt-4">
          <div className="w-8 h-8 rounded-full border border-border overflow-hidden grayscale group-hover:grayscale-0 transition-all flex-shrink-0">
            {post.userPhotoURL ? (
              <img src={post.userPhotoURL} alt={post.userName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-sub bg-accent">
                <User size={14} />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-main truncate">
              {post.userName}
            </span>
            <div className="flex items-center text-[10px] text-text-sub font-bold uppercase tracking-widest whitespace-nowrap">
              <span>{formatDate(post.createdAt.toDate())}</span>
              <span className="mx-2">•</span>
              <span>{readingTime}m read</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
