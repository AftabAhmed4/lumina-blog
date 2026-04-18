import { Zap, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border pt-24 pb-12 px-6 sm:px-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1 space-y-8">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
              LUMINA
            </Link>
            <p className="text-text-sub text-sm leading-relaxed font-medium">
              A curated space for the curious. Empowering writers to build their digital legacy through intentional storytelling and refined design.
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-text-sub hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-text-sub hover:text-primary transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-text-sub hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-sub mb-8">Magazine</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Discover</Link></li>
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">The Archive</Link></li>
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Featured Stories</Link></li>
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Authors</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-sub mb-8">Collective</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Our Story</Link></li>
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Privacy Policy</Link></li>
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Terms of Service</Link></li>
              <li><Link to="/" className="text-text-main hover:italic font-serif text-lg transition-all">Contact Us</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-sub mb-8">Join the List</h4>
            <p className="text-sm text-text-sub font-medium">Weekly insights into technology, culture, and design.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-accent border border-border rounded-xl px-4 py-3 text-sm w-full outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <button className="px-4 bg-primary text-bg rounded-xl shadow-lg hover:scale-105 transition-transform">
                <Mail size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-text-sub">
          <span>&copy; 2026 Lumina Publications.</span>
          <div className="flex items-center gap-8 mt-6 md:mt-0">
            <span className="hover:text-primary cursor-pointer">Built with Intelligence</span>
            <span className="hover:text-primary cursor-pointer">Refined with Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
