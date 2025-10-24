import { Github, Twitter, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-deep-black border-t border-border/40">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-copper flex items-center justify-center">
                <span className="text-deep-black font-bold">A</span>
              </div>
              <span className="text-xl font-semibold text-gradient-copper">Aligno</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering teams to achieve more through intelligent project management 
              and seamless collaboration.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} Aligno. All rights reserved.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Press Kit
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Community
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3 mb-6">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                  Security
                </a>
              </li>
            </ul>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-copper transition-smooth">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-copper transition-smooth">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-copper transition-smooth">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-copper transition-smooth">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            Built with passion for teams that dream big
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
