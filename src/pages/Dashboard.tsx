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
import { formatDate, cleanURL } from '../lib/utils';
import { getUserPosts, deletePost, getUsers, deleteUserAccount, syncUser, getPosts } from '../lib/firestore';
import { isAdmin } from '../lib/auth';
import Modal from '../components/Modal';
import { Users, UserX, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userPostCounts, setUserPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
  const userIsAdmin = isAdmin(user);
  
  useEffect(() => {
    console.log('Dashboard Auth State:', { email: user?.email, isAdmin: userIsAdmin });
  }, [user, userIsAdmin]);

  useEffect(() => {
    if (users.length > 0) {
      console.log('[DEBUG] Users List Updated:', users);
    }
  }, [users]);
  
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
    
    setLoading(true);
    
    // Posts listener
    const unsubscribePosts = getUserPosts(user.uid, (data) => {
      setPosts(data);
      if (activeTab === 'posts') setLoading(false);
    });

    // Users listener (if admin)
    let unsubscribeUsers = () => {};
    let unsubscribeAllPosts = () => {};

    if (userIsAdmin && activeTab === 'users') {
      unsubscribeUsers = getUsers(
        (data) => {
          setUsers(data);
          setLoading(false);
          setError(null);
        },
        (err: any) => {
          console.error('getUsers Failed:', err);
          setError('Insufficient permissions or sync error. Please refresh.');
          setLoading(false);
        }
      );

      // Fetch all posts to count stories per user
      unsubscribeAllPosts = getPosts((allPosts) => {
        const counts: Record<string, number> = {};
        allPosts.forEach(p => {
          counts[p.userId] = (counts[p.userId] || 0) + 1;
        });
        setUserPostCounts(counts);
      });
    }

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
      unsubscribeAllPosts();
    };
  }, [user, userIsAdmin, activeTab]);

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

  const handleUserDeleteClick = (targetUser: any) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User Account?',
      message: `Are you sure you want to permanently delete the account for ${targetUser.email}? This will remove them from the system completely.`,
      type: 'confirm',
      targetId: targetUser.uid,
      onConfirm: async () => {
        try {
          await deleteUserAccount(targetUser.uid);
          setModalConfig(prev => ({ 
            ...prev, 
            isOpen: true, 
            type: 'success', 
            title: 'Success', 
            message: 'User account has been deleted.',
            onConfirm: undefined 
          }));
        } catch (err: any) {
          setModalConfig({
            isOpen: true,
            title: 'Delete Failed',
            message: err.message || 'Something went wrong while deleting user.',
            type: 'error'
          });
        }
      }
    });
  };

  const totalViews = posts.reduce((acc, post) => acc + (post.views || 0), 0);
  const totalLikesList = posts.reduce((acc, post) => acc + (post.likes?.length || 0), 0);

  const stats = [
    { label: 'Total Stories', value: posts.length.toString(), icon: FileText, color: 'text-primary', bg: 'bg-accent' },
    { label: 'Total Views', value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString(), icon: Eye, color: 'text-text-main', bg: 'bg-accent' },
    { label: 'Engagement', value: totalLikesList.toString(), icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  if (userIsAdmin && activeTab === 'users') {
    stats.unshift({ label: 'Registered Members', value: users.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' });
  }

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

        {/* Tabs (if admin) */}
        {userIsAdmin && (
          <div className="flex bg-accent/50 p-1 rounded-xl mb-8 w-full sm:w-fit">
            <button
              onClick={() => setActiveTab('posts')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                activeTab === 'posts' ? "bg-primary text-bg shadow-lg shadow-primary/20" : "text-text-sub hover:text-text-main"
              )}
            >
              <FileText size={14} />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                activeTab === 'users' ? "bg-primary text-bg shadow-lg shadow-primary/20" : "text-text-sub hover:text-text-main"
              )}
            >
              <Users size={14} />
              Users
            </button>
          </div>
        )}

        {activeTab === 'posts' ? (
          <>
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
              {/* ... existing table code ... */}
              <div className="hidden md:block overflow-x-auto">
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
                              <img src={cleanURL(post.imageURL) || undefined} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                            {formatDate(post.createdAt?.toDate ? post.createdAt.toDate() : new Date())}
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

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-border">
                {loading ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="p-6">
                      <div className="h-5 w-48 bg-accent animate-pulse rounded mb-2" />
                      <div className="h-4 w-32 bg-accent animate-pulse rounded" />
                    </div>
                  ))
                ) : posts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent shrink-0 border border-border">
                          <img src={cleanURL(post.imageURL) || undefined} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-sm text-text-main line-clamp-1">{post.title}</h3>
                          <p className="text-[10px] text-text-sub font-medium">
                            {formatDate(post.createdAt?.toDate ? post.createdAt.toDate() : new Date())}
                          </p>
                        </div>
                      </div>
                      {post.status === 'draft' && (
                        <span className="text-[8px] font-black uppercase tracking-[0.1em] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Draft</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-text-sub uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Eye size={12} /> {post.views || 0}</span>
                        <span className="flex items-center gap-1"><Heart size={12} /> {post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/edit/${post.id}`} className="p-2 bg-accent rounded-lg text-text-sub hover:text-primary transition-colors border border-border">
                          <Edit3 size={14} />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(post.id)}
                          className="p-2 bg-accent rounded-lg text-text-sub hover:text-red-500 transition-colors border border-border"
                        >
                          <Trash2 size={14} />
                        </button>
                        <Link to={`/post/${post.id}`} className="p-2 bg-primary rounded-lg text-white transition-colors border border-primary shadow-sm shadow-primary/20">
                          <Eye size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
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
          </>
        ) : (
          /* User Management View */
          <div className="bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
            <div className="p-8 border-b border-border bg-accent/30">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <ShieldCheck className="text-blue-500" size={20} />
                Directory of Registered Members
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-sub mt-2">
                Manage accounts and oversee platform participants
              </p>
            </div>

            {error && (
              <div className="mx-8 mt-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-accent">
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Identity</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Email Address</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Stories</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub">Last Login</th>
                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-text-sub text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="px-8 py-6"><div className="h-5 w-32 bg-accent animate-pulse rounded" /></td>
                        <td className="px-8 py-6"><div className="h-5 w-48 bg-accent animate-pulse rounded" /></td>
                        <td className="px-8 py-6"><div className="h-5 w-24 bg-accent animate-pulse rounded" /></td>
                        <td className="px-8 py-6 text-right"><div className="h-5 w-10 bg-accent animate-pulse rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : users.map((u) => (
                    <tr key={u.uid} className="hover:bg-accent/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-accent border border-border shrink-0">
                            <img src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName}`} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="font-bold text-text-main">{u.displayName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-text-sub">{u.email}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            (userPostCounts[u.uid] || 0) > 0 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-gray-50 text-gray-400 border-gray-100"
                          )}>
                            {userPostCounts[u.uid] || 0} Stories
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-text-sub">
                          {u.lastLogin?.toDate ? formatDate(u.lastLogin.toDate()) : 'Recently'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {!isAdmin(u) ? (
                          <button 
                            onClick={() => handleUserDeleteClick(u)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                            title="Delete Account"
                          >
                            <UserX size={18} />
                          </button>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-accent px-2 py-1 rounded">Super Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && !loading && (
              <div className="p-20 text-center text-text-sub">
                No users found in the system.
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.type === 'confirm' ? (activeTab === 'posts' ? 'Delete Story' : 'Delete Account') : 'Understood'}
      />
    </div>
  );
}

// Helper for cn in this file
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
