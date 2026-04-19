import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Zap, 
  LayoutDashboard, 
  PlusSquare, 
  LogOut, 
  User as UserIcon,
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { logout, isAdmin } from '../lib/auth';
import { useTheme } from './ThemeProvider';

interface NavbarProps {
  user: any;
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const userIsAdmin = isAdmin(user);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Discover', path: '/' },
    { name: 'AI Writer', path: '/ai-assistant' },
  ];

  const authenticatedLinks = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create Post', path: '/create', icon: PlusSquare },
  ] : [];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-10 h-16 flex items-center border-b border-border shadow-sm",
        scrolled ? "bg-bg/80 backdrop-blur-md" : "bg-bg"
      )}
    >
      <div className="w-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-extrabold tracking-tighter text-primary">
          LUMINA
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.path ? "text-primary font-bold" : "text-text-sub"
              )}
            >
              {link.name}
            </Link>
          ))}

          {user && (
            <>
              <div className="w-px h-4 bg-border" />
              <Link 
                to="/dashboard" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === '/dashboard' ? "text-primary font-bold" : "text-text-sub"
                )}
              >
                Hub
              </Link>
              <Link 
                to="/create" 
                className="flex items-center gap-2 px-4 py-2 bg-primary text-bg rounded-lg text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-md shadow-primary/20"
              >
                <PlusSquare size={14} />
                New Story
              </Link>
            </>
          )}

          <div className="w-px h-4 bg-border" />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent transition-colors text-text-sub"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-bold text-text-main overflow-hidden ring-1 ring-border shadow-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <span className="uppercase">{user.displayName?.charAt(0) || 'U'}</span>
                )}
              </div>
              <button 
                onClick={() => logout()}
                className="p-2 text-text-sub hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2 bg-primary text-bg rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-sub dark:text-gray-400"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            className="p-2 text-gray-600 dark:text-gray-400"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-bg border-b border-border shadow-xl px-4 py-6"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-black uppercase tracking-widest text-text-main"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="h-px bg-gray-100 dark:bg-gray-900 my-2" />
                  {authenticatedLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 text-lg font-medium text-gray-900 dark:text-white"
                    >
                      <link.icon size={22} />
                      <span>{link.name}</span>
                    </Link>
                  ))}
                  <button 
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="flex items-center space-x-3 text-lg font-medium text-red-500 pt-2"
                  >
                    <LogOut size={22} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-center font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
