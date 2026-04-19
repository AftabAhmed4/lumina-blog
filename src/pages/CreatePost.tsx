import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Image as ImageIcon, 
  Music, 
  Send, 
  Trash2, 
  FileText, 
  ChevronLeft,
  X,
  Plus
} from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { createPost, updatePost, getPostById, uploadFile } from '../lib/firestore';
import Modal from '../components/Modal';

interface CreatePostProps {
  user: any;
}

export default function CreatePost({ user }: CreatePostProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [image, setImage] = useState<File | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  });

  // Initialize from location state if available (passed from AI Chat)
  useEffect(() => {
    if (location.state?.draft) {
      const { draft } = location.state;
      if (draft.title) setTitle(draft.title);
      if (draft.content) setContent(draft.content);
      if (draft.category) setCategory(draft.category);
    }
  }, [location.state]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingImageURL, setExistingImageURL] = useState('');
  const [existingAudioURL, setExistingAudioURL] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      getPostById(id).then(post => {
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setCategory(post.category as any || 'Technology');
          setImagePreview(post.imageURL);
          setExistingImageURL(post.imageURL);
          if (post.audioURL) {
            setAudioName('Current Audio Narration');
            setExistingAudioURL(post.audioURL);
          }
        }
      });
    }
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudio(file);
      setAudioName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: 'published' | 'draft' = 'published') => {
    if (e) e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      let imageURL = existingImageURL;
      let audioURL = existingAudioURL;

      if (image) {
        imageURL = await uploadFile(image, 'images');
      }

      if (audio) {
        audioURL = await uploadFile(audio, 'audio');
      }

      const postData = {
        title,
        content,
        category,
        imageURL,
        audioURL,
        status,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
      };

      if (id) {
        await updatePost(id, postData as any);
      } else {
        await createPost(postData as any);
      }

      setModalConfig({
        isOpen: true,
        title: status === 'published' ? 'Story Published!' : 'Draft Saved',
        message: status === 'published' 
          ? 'Your story is now live and available for readers to explore.'
          : 'Your draft has been saved. You can continue writing whenever you like.',
        type: 'success'
      });
      
      // Auto-navigate after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message.includes('Storage CORS error') 
        ? "CORS Error: Please update your Firebase Storage CORS settings using Google Cloud Shell (instructions sent in chat)."
        : 'Failed to save story. Please check your connection and try again.';
      
      setModalConfig({
        isOpen: true,
        title: 'Heads Up!',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-bg">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-xs font-bold text-text-sub hover:text-primary transition-colors mb-10 uppercase tracking-wide"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Hub
        </Link>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <h1 className="text-3xl font-serif font-bold text-text-main mb-12 tracking-tight">
              {id ? 'Refine Your Publication' : 'Draft a New Publication'}
            </h1>

            <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-10">
              {/* Image Upload Area */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-sub ml-1">Featured Cover</label>
                <div 
                  onClick={() => imageInputRef.current?.click()}
                  className="relative h-80 w-full rounded-xl border border-border bg-accent hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-6 text-center group"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-text-main/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <p className="text-white font-bold uppercase tracking-widest text-xs">Update Image</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-border text-text-sub mb-4 flex items-center justify-center group-hover:text-primary group-hover:scale-105 transition-all">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-sm font-bold text-text-main mb-1">Upload high-resolution cover</p>
                      <p className="text-[11px] text-text-sub font-medium">Recommended: 1600x900px JPG or PNG</p>
                    </>
                  )}
                </div>
                <input 
                  ref={imageInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-3 space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-sub ml-1">Publication Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-accent border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-xl font-bold text-text-main placeholder:text-slate-300 transition-all"
                    placeholder="Capture the essence..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-sub ml-1">Category</label>
                  <select
                    className="w-full px-5 py-4 bg-accent border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm font-bold text-text-main appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Technology</option>
                    <option>Lifestyle</option>
                    <option>Business</option>
                    <option>Creative</option>
                    <option>News</option>
                    <option>Poetic</option>
                  </select>
                </div>
              </div>

              {/* Audio Upload */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-sub ml-1">Audio Narration (Optional)</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="flex items-center space-x-3 px-6 py-4 bg-accent border border-border rounded-xl text-xs font-bold text-text-main hover:bg-slate-200 transition-all"
                  >
                    <Music size={16} className="text-primary" />
                    <span>{audioName || 'Include Audio File'}</span>
                  </button>
                  {audioName && (
                    <button 
                      type="button"
                      onClick={() => { setAudio(null); setAudioName(null); }}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <input 
                  ref={audioInputRef}
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={handleAudioChange}
                />
              </div>

              {/* Content Editor */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-sub ml-1">Story Content</label>
                <textarea
                  required
                  rows={15}
                  className="w-full px-8 py-6 bg-accent border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-base leading-relaxed text-text-main placeholder:text-slate-300 resize-none font-medium"
                  placeholder="Share your thoughts... Markdown is supported for styling."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-grow py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-md hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} className="mr-3" />
                      <span>{id ? 'Save Changes' : 'Publish Story'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as any, 'draft')}
                  disabled={isLoading}
                  className="px-10 py-4 bg-accent border border-border text-text-main rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all text-center text-sm disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <Link
                  to="/dashboard"
                  className="px-10 py-4 bg-transparent border border-transparent text-text-sub rounded-xl font-bold uppercase tracking-widest hover:text-text-main transition-all text-center text-sm"
                >
                  Discard
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
