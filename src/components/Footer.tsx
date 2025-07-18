import { Facebook, Twitter, Linkedin, Github, Mail } from "lucide-react";
export const Footer = () => {
  return <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold">Leasy</span>
            </div>
            <p className="text-background/70 mb-6 max-w-md leading-relaxed">The cloud platform for property professionals to manage, optimize, and distribute listings across multiple channels effortlessly.</p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-background/70">
              <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-background transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-background transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Changelog</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Roadmap</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">About</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Partners</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/20 pt-12 mb-12">
          <div className="max-w-md">
            <h3 className="font-semibold mb-2">Stay updated</h3>
            <p className="text-background/70 mb-4">
              Get the latest news, updates, and tips for property management.
            </p>
            <div className="flex gap-2">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2 bg-background/10 border border-background/20 rounded-lg text-background placeholder-background/50 focus:outline-none focus:ring-2 focus:ring-primary" />
              <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Legal Info */}
        <div className="border-t border-background/20 pt-8 mb-8">
          <div className="text-background/70 text-sm space-y-2">
            <div className="font-medium text-background">Leasy is powered by FARAWAYHOME</div>
            <div>FARAWAYHOME OÜ</div>
            <div>Tornimäe 5, 10145 Tallinn, Estonia</div>
            <div>Tax num.: EE102783607 | Company num.: 17081333</div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-background/70 text-sm">
            © 2024 Leasy. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-background/70">
            <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-background transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-background transition-colors">GDPR</a>
          </div>
        </div>
      </div>
    </footer>;
};