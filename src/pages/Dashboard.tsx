import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye,
  LayoutDashboard,
  Zap,
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import { formatDate } from '../lib/utils';
import { getPosts, deletePost } from '../lib/firestore';
import Modal from '../components/Modal';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
    targetId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDeleteClick = (postId: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Story?',
      message: 'Are you sure you want to delete this publication? This action is permanent and cannot be reversed.',
      type: 'confirm',
      targetId: postId,
      onConfirm: async () => {
        try {
          // Use postId directly from the outer scope to avoid closure/stale state issues
          await deletePost(postId);
          setModalConfig(prev => ({ 
            ...prev, 
            isOpen: true, 
            type: 'success', 
            title: 'Success', 
            message: 'Story has been deleted.',
            onConfirm: undefined 
          }));
        } catch (err: any) {
          setModalConfig({
            isOpen: true,
            title: 'Delete Failed',
            message: err.message || 'Something went wrong while deleting.',
            type: 'error'
          });
        }
      }
    });
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const totalViews = posts.reduce((acc, post) => acc + (post.views || 0), 0);
  const totalLikesList = posts.reduce((acc, post) => acc + (post.likes?.length || 0), 0);

  const stats = [
    { label: 'Total Stories', value: posts.length.toString(), icon: FileText, color: 'text-primary', bg: 'bg-accent' },
    { label: 'Total Views', value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString(), icon: Eye, color: 'text-text-main', bg: 'bg-accent' },
    { label: 'Engagement', value: totalLikesList.toString(), icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20  px-6 sm:px-10 bg-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-text-main tracking-tight mb-2">Creator Hub</h1>
            <p className="text-text-sub font-medium">Manage your publications and monitor engagement.</p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold transition-all shadow-md hover:opacity-90 active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            <span>New Story</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface p-8 rounded-2xl border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-lg", stat.bg, stat.color)}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Live</span>
              </div>
              <p className="text-xs font-bold text-text-sub uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-text-main">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Content Table */}
        <div className="bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
          <div className="p-8 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main flex items-center">
              Recent Stories
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-accent">
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Story</th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Stats</th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Date</th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(2).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-6"><div className="h-5 w-48 bg-accent animate-pulse rounded" /></td>
                      <td className="px-8 py-6"><div className="h-5 w-20 bg-accent animate-pulse rounded" /></td>
                      <td className="px-8 py-6"><div className="h-5 w-32 bg-accent animate-pulse rounded" /></td>
                      <td className="px-8 py-6 text-right"><div className="h-5 w-10 bg-accent animate-pulse rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : posts.map((post) => (
                  <tr key={post.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-accent shrink-0">
                          <img src={post.imageURL || undefined} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-main max-w-xs truncate">{post.title}</span>
                          {post.status === 'draft' && (
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Draft</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 text-xs font-semibold text-text-sub">
                        <span className="flex items-center gap-1"><Eye size={14} /> {post.views || 0}</span>
                        <span className="flex items-center gap-1"><Heart size={14} /> {post.likes?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-text-sub">
                        {formatDate(post.createdAt.toDate())}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/edit/${post.id}`} className="p-2 text-text-sub hover:text-primary transition-colors">
                          <Edit3 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(post.id)}
                          className="p-2 text-text-sub hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {posts.length === 0 && !loading && (
            <div className="p-20 text-center">
              <div className="inline-flex p-6 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 mb-6">
                <FileText size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No stories yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Start your writing journey by creating your first story.</p>
              <Link to="/create" className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20">
                Write a Story
              </Link>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.type === 'confirm' ? 'Delete Story' : 'Great'}
      />
    </div>
  );
}

// Helper for cn in this file
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
