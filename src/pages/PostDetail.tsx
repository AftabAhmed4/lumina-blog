import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Calendar, 
  User, 
  Clock, 
  ChevronLeft, 
  Heart, 
  Share2, 
  MessageSquare,
  Facebook,
  Twitter,
  Link as LinkIcon,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AudioPlayer from '../components/AudioPlayer';
import { PostDetailSkeleton } from '../components/LoadingSkeleton';
import { Post, Comment as CommentType } from '../types';
import { formatDate, estimateReadingTime, cn, cleanURL } from '../lib/utils';
import { getPostById, toggleLikePost, incrementPostViews, getCommentsByPost, createComment } from '../lib/firestore';
import { isAdmin } from '../lib/auth';

interface PostDetailProps {
  user: any;
}

export default function PostDetail({ user }: PostDetailProps) {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      incrementPostViews(id);
      getPostById(id).then(data => {
        setPost(data);
        setLoading(false);
      });

      // Subscribe to comments
      const unsubscribe = getCommentsByPost(id, (data) => {
        setComments(data);
      });
      return () => unsubscribe();
    }
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      await createComment(id, {
        postId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        text: newCommentText.trim(),
      });
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      await toggleLikePost(post.id, user.uid, post.likes);
      // Update local state for immediate feedback
      const hasLiked = post.likes?.includes(user.uid);
      const newLikes = hasLiked 
        ? post.likes?.filter(uid => uid !== user.uid)
        : [...(post.likes || []), user.uid];
      setPost({ ...post, likes: newLikes });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <PostDetailSkeleton />;
  if (!post) return <div className="pt-32 text-center h-screen">Post not found</div>;

  // Protect drafts
  const canViewDraft = isAdmin(user) || post.userId === user?.uid;
  if (post.status === 'draft' && !canViewDraft) {
    return (
      <div className="pt-32 text-center h-screen flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-black uppercase tracking-widest text-text-sub">Private Publication</h2>
        <p className="text-text-sub max-w-sm font-medium">This story is currently in draft mode and is not visible to the public.</p>
        <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-primary hover:italic transition-all">
          Return to Archive
        </Link>
      </div>
    );
  }

  const readingTime = estimateReadingTime(post.content);
  const isLiked = user && post.likes?.includes(user.uid);

  return (
    <div className="min-h-screen bg-bg text-text-main transition-colors duration-300">
      {/* Editorial Header Section */}
      <section className="relative pt-32 pb-20 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <Link 
            to="/" 
            className="group inline-flex items-center text-[10px] font-black text-text-sub hover:text-primary transition-all mb-16 uppercase tracking-[0.4em]"
          >
            <ChevronLeft size={12} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Archive
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16 items-start">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-primary text-bg text-[9px] font-black uppercase tracking-[0.3em] rounded-sm">{post.category || 'Article'}</span>
                <span className="w-8 h-px bg-border" />
                <span className="text-[10px] text-text-sub font-bold uppercase tracking-[0.2em]">
                   Reading Time: {readingTime} min
                </span>
              </div>
              
              <h1 className="text-2xl md:text-2xl lg:text-2xl font-serif font-bold leading-[0.92] tracking-tighter transform -rotate-1 origin-left">
                {post.title}
              </h1>
            </div>

            <div className="lg:pt-4 space-y-8 lg:border-l lg:border-border lg:pl-10">
              <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-sub">Published By</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-border overflow-hidden grayscale grayscale-0 transition-all shadow-sm">
                    {post.userPhotoURL ? (
                      <img src={post.userPhotoURL} alt={post.userName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-sub bg-accent">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest">{post.userName}</h4>
                    <p className="text-[10px] text-text-sub font-bold uppercase tracking-widest mt-0.5">{formatDate(post.createdAt.toDate())}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleLike}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border shadow-sm active:scale-95",
                    isLiked ? "bg-red-500 text-white border-red-500" : "bg-bg text-text-main border-border hover:bg-accent"
                  )}
                >
                  <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                  <span>{post.likes?.length || 0}</span>
                </button>
                <button className="p-3 bg-accent border border-border rounded-xl text-text-main hover:bg-white dark:hover:bg-black transition-all shadow-sm">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-10 mb-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="aspect-[21/9] w-full rounded-[40px] md:rounded-[60px] overflow-hidden shadow-2xl border border-border bg-accent"
        >
          <img 
            src={cleanURL(post.imageURL) || undefined} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-20">
        <main className="min-w-0">
          <article className="prose prose-xl dark:prose-invert max-w-none 
            prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-headings:leading-none
            prose-p:text-text-sub/90 prose-p:font-medium prose-p:leading-[1.8] prose-p:text-lg
            prose-a:text-primary prose-a:font-bold prose-a:underline-offset-8 prose-a:transition-all hover:prose-a:text-primary/70
            prose-img:rounded-[32px] prose-img:shadow-xl prose-img:border prose-img:border-border
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-accent prose-blockquote:py-6 prose-blockquote:px-10 prose-blockquote:rounded-r-2xl prose-blockquote:font-serif prose-blockquote:italic
            prose-strong:text-text-main prose-strong:font-black">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </article>
        </main>

        {/* Sidebar / Extra Info */}
        <aside className="hidden lg:block space-y-16">
          <div className="sticky top-32 space-y-12">
            {/* Share Widget */}
            <div className="p-8 bg-surface border border-border rounded-[32px] shadow-sm space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-sub">Broadcast</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center p-4 bg-accent rounded-2xl hover:bg-primary hover:text-bg transition-all group">
                  <Twitter size={18} className="group-hover:scale-110 transition-transform" />
                </button>
                <button className="flex items-center justify-center p-4 bg-accent rounded-2xl hover:bg-primary hover:text-bg transition-all group">
                  <Facebook size={18} className="group-hover:scale-110 transition-transform" />
                </button>
                <button className="col-span-2 flex items-center justify-center gap-3 py-4 bg-accent rounded-2xl hover:bg-primary hover:text-bg transition-all font-black uppercase tracking-widest text-[9px] group">
                  <LinkIcon size={14} className="group-hover:rotate-12 transition-transform" />
                  Copy Link
                </button>
              </div>
            </div>

            {/* Newsletter widget */}
            <div className="p-8 bg-primary rounded-[32px] text-bg shadow-xl relative overflow-hidden group">
              <Zap className="absolute -right-4 -top-4 w-20 h-20 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
              <h4 className="text-xl font-serif font-bold italic mb-3 relative z-10">Lumina Daily</h4>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-relaxed mb-6 relative z-10">
                Fresh insights delivered to your private collection weekly.
              </p>
              <div className="relative z-10">
                <input 
                  type="email" 
                  placeholder="Your digital address" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs outline-none placeholder:text-white/30 focus:bg-white/20 transition-all font-bold"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-32">
        {/* Author Bio Section */}
        <div className="p-10 bg-accent rounded-[40px] border border-border flex flex-col md:flex-row gap-8 items-center text-center md:text-left mb-32">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all">
            <img src={post.userPhotoURL || undefined} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Written By</p>
            <h3 className="text-2xl font-serif font-bold italic mb-3">{post.userName}</h3>
            <p className="text-sm text-text-sub font-medium leading-relaxed max-w-md">
              A regular contributor to Lumina, exploring the intersection of creative storytelling and modern development.
            </p>
          </div>
        </div>

        {/* Comments Section */}
        <section id="comments" className="relative">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-4xl font-serif font-bold italic">Reflections</h2>
            <div className="h-px flex-grow bg-border/50" />
            <span className="text-[10px] font-black text-text-sub uppercase tracking-[0.4em]">{comments.length} Thoughts</span>
          </div>

          {!user ? (
            <div className="p-16 bg-surface border border-border border-dashed rounded-[40px] text-center mb-20 group">
              <User className="mx-auto mb-6 text-text-sub/20 group-hover:text-primary/40 transition-colors" size={40} />
              <p className="text-text-sub font-black uppercase tracking-[0.3em] text-[10px] mb-8">Join the intellectual discourse</p>
              <Link to="/login" className="inline-block px-12 py-5 bg-primary text-bg rounded-full font-black uppercase tracking-widest text-[10px] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                Identify Yourself
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCommentSubmit} className="mb-24">
              <div className="space-y-6">
                <div className="relative">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Contribute your perspective..."
                    rows={4}
                    className="w-full p-10 bg-accent border border-border rounded-[40px] focus:ring-1 focus:ring-primary outline-none text-lg font-medium text-text-main placeholder:text-text-sub/30 resize-none transition-all shadow-inner"
                  />
                  <div className="absolute top-8 left-10 p-2 bg-primary/10 rounded-lg text-primary pointer-events-none">
                    <MessageSquare size={14} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className={cn(
                      "px-12 py-5 rounded-full font-black uppercase tracking-widest text-[10px] transition-all shadow-xl",
                      submittingComment || !newCommentText.trim() 
                        ? "bg-border text-text-sub cursor-not-allowed" 
                        : "bg-primary text-bg hover:shadow-2xl hover:scale-105 active:scale-95"
                    )}
                  >
                    {submittingComment ? 'Submitting...' : 'Release Thought'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-16">
            {comments.length > 0 ? (
              comments.map((comment, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  key={comment.id} 
                  className="group flex gap-8 items-start"
                >
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-14 h-14 rounded-2xl border border-border overflow-hidden grayscale grayscale-0 hover:grayscale-0 transition-all shadow-md transform group-hover:rotate-3">
                      {comment.userPhotoURL ? (
                        <img src={comment.userPhotoURL} alt={comment.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-sub bg-accent">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow space-y-4 pt-1">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main">{comment.userName}</h4>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub/60">
                        {comment.createdAt ? formatDate(comment.createdAt.toDate()) : 'Recently'}
                      </span>
                    </div>
                    <p className="text-base leading-[1.8] text-text-sub/90 font-medium group-hover:text-text-main transition-colors max-w-2xl">
                      {comment.text}
                    </p>
                    <div className="flex gap-4 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="text-[9px] font-black uppercase tracking-widest text-text-sub hover:text-primary transition-colors">Appreciate</button>
                       <button className="text-[9px] font-black uppercase tracking-widest text-text-sub hover:text-primary transition-colors">Discuss</button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 opacity-20 filter grayscale">
                <MessageSquare size={60} className="mx-auto mb-8 stroke-1" />
                <p className="font-serif italic text-2xl tracking-tight">The conversation awaits its first voice.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Audio Player */}
      {post.audioURL && (
        <AudioPlayer src={cleanURL(post.audioURL)} title={post.title} />
      )}
    </div>
  );
}
