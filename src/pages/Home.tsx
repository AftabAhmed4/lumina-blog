import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, TrendingUp, Zap, Sparkles, ArrowRight } from 'lucide-react';
import PostCard from '../components/PostCard';
import { PostCardSkeleton } from '../components/LoadingSkeleton';
import { Post } from '../types';
import { getPosts } from '../lib/firestore';
import { formatDate, estimateReadingTime, cleanURL } from '../lib/utils';
import { isAdmin } from '../lib/auth';

interface HomeProps {
  user: any;
}

export default function Home({ user }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = getPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => 
    (post.status === 'published' || !post.status) && (
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen pt-16 bg-bg text-text-main transition-colors duration-300">
      {/* Editorial Hero Section */}
      {!loading && posts.length > 0 && searchQuery === '' && (
        <section className="relative w-full border-b border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-2">
                <span className="w-12 h-[1px] bg-primary"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-sub">The Highlight</span>
              </div>
              
              <Link to={`/post/${posts[0].id}`} className="block group">
                <h1 className="text-xl md:text-xl lg:text-4xl font-serif font-bold leading-[0.95] mb-8 group-hover:italic transition-all duration-500">
                  {posts[0].title}
                </h1>
              </Link>
              
              <p className="text-xl text-text-sub font-medium max-w-xl leading-relaxed">
                {posts[0].content.replace(/[#*`]/g, '').slice(0, 160)}...
              </p>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-border overflow-hidden grayscale hover:grayscale-0 transition-all">
                    <img src={posts[0].userPhotoURL || undefined} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider">{posts[0].userName}</span>
                    <span className="text-[10px] text-text-sub font-medium uppercase tracking-widest">{formatDate(posts[0].createdAt.toDate())}</span>
                  </div>
                </div>
                <Link 
                  to={`/post/${posts[0].id}`}
                  className="px-6 py-3 bg-primary text-bg rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Read Story
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square md:aspect-[4/5] lg:aspect-square rounded-[40px] overflow-hidden shadow-2xl"
            >
              <img 
                src={cleanURL(posts[0].imageURL) || undefined} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Main Layout Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 italic">
              {searchQuery ? `Search: ${searchQuery}` : 'Recent Publications'}
            </h2>
            <p className="text-text-sub font-medium uppercase tracking-widest text-xs">Exploring categories from lifestyle to development</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" size={16} />
            <input 
              type="text" 
              placeholder="Search stories..." 
              className="w-full pl-10 pr-4 py-3 bg-accent border border-border rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-20">
          {/* Main Feed Column */}
          <div className="space-y-20">
            {/* Post Grid with Scroll logic after 6 posts */}
            <div className={`
              ${!loading && filteredPosts.slice(searchQuery ? 0 : 1).length > 6 ? 'max-h-[1600px] overflow-y-auto pr-6' : ''}
              grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16
            `}>
              {loading ? (
                Array(4).fill(0).map((_, i) => <PostCardSkeleton key={i} />)
              ) : (
                filteredPosts.slice(searchQuery ? 0 : 1).map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))
              )}
            </div>
            
            {!loading && filteredPosts.length === 0 && (
              <div className="py-24 text-center bg-accent rounded-[40px] border border-border border-dashed">
                <Search className="mx-auto text-text-sub mb-4 opacity-20" size={60} />
                <h3 className="text-2xl font-serif font-bold mb-2">Silent corridors...</h3>
                <p className="text-text-sub font-medium">No results matched your search criteria.</p>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <aside className="space-y-16">
            {/* Trending Section */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-sub flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  Trending
                </h3>
                <div className="w-12 h-px bg-border"></div>
              </div>
              <div className="space-y-8">
                {posts.slice(0, 5).map((post, i) => (
                  <Link key={post.id} to={`/post/${post.id}`} className="group flex gap-5 items-start">
                    <span className="text-2xl font-serif font-bold text-border group-hover:text-primary transition-colors leading-none italic">
                      0{i + 1}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-sm font-bold leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-text-sub font-bold uppercase tracking-wider">
                        <span>{estimateReadingTime(post.content)}m read</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span>{post.category}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA Sidebar Widget - ONLY Show for Admin */}
            {isAdmin(user) && (
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-primary rounded-[32px] p-8 text-bg relative overflow-hidden group shadow-xl"
              >
                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/10 rotate-12" />
                <h4 className="text-xl font-serif font-bold mb-2 relative z-10 italic">Creator Hub</h4>
                <p className="text-sm opacity-60 mb-8 relative z-10 leading-relaxed font-semibold">
                  Oversee publication metrics and refine your creative workflow.
                </p>
                <Link to="/dashboard" className="inline-flex items-center gap-2 bg-bg text-primary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-opacity-90 transition-all">
                  Access Portal
                  <Zap size={14} fill="currentColor" />
                </Link>
              </motion.div>
            )}

            {/* Newsletter / Static Info */}
            <div className="bg-accent rounded-[32px] p-8 border border-border">
              <h4 className="text-sm font-black uppercase tracking-widest mb-4">Newsletter</h4>
              <p className="text-xs text-text-sub font-medium leading-relaxed mb-6">
                Receive the best of Lumina once a week, curated by our editorial team.
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="flex-grow bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary" />
                <button className="p-2 bg-primary text-bg rounded-lg">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
