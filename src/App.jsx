import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Menu,
  MoveDown,
  Code2,
  Megaphone,
  Camera,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Linkedin,
  Send
} from 'lucide-react';
import './App.css';
import { useStarfield } from './hooks/useStarfield';
import { useThreeBackground } from './hooks/useThreeBackground';
import CinematicIntro from './components/CinematicIntro';
import svcWeb from './assets/services/svc-web.jpg';
import svcMarketing from './assets/services/svc-marketing.jpg';
import svcMedia from './assets/services/svc-media.jpg';
import svcDesign3d from './assets/services/svc-design3d.jpg';
import whyStrategy from './assets/why-pixlenova/strategy-first.jpg';
import whyDesign from './assets/why-pixlenova/premium-design.jpg';
import whyExecution from './assets/why-pixlenova/fast-execution.jpg';
import whyGrowth from './assets/why-pixlenova/growth-mindset.jpg';
import projWeb from './assets/projects/web-design.jpg';
import projBranding from './assets/projects/branding.jpg';
import projSocial from './assets/projects/social-media.jpg';
import projVideo from './assets/projects/video-production.jpg';
import projEvent from './assets/projects/event-media.jpg';
import proj3d from './assets/projects/3d-motion.jpg';

const servicesData = [
  {
    id: "web",
    num: "01",
    title: "Web & Technology",
    img: svcWeb,
    items: ["Website Design", "Web Development", "Landing Pages", "Business Websites", "UI / UX Design"],
    secondaryTitle: "WEB EXPERIENCE",
    secondaryList: ["01 — Structure", "02 — Interface", "03 — Interaction", "04 — Experience"]
  },
  {
    id: "marketing",
    num: "02",
    title: "Digital Marketing",
    img: svcMarketing,
    items: ["SEO & Local SEO", "Google Ads", "Social Media Marketing", "Lead Generation", "Email Marketing"],
    secondaryTitle: "GROWTH SYSTEM",
    secondaryList: ["01 — Audience", "02 — Strategy", "03 — Conversion", "04 — Analytics"]
  },
  {
    id: "media",
    num: "03",
    title: "Creative Media",
    img: svcMedia,
    items: ["Product Photography", "Promotional Videos", "Wedding & Events", "Birthday Functions", "Reels & Short Films"],
    secondaryTitle: "VISUAL STORY",
    secondaryList: ["01 — Direction", "02 — Production", "03 — Post-Edit", "04 — Delivery"]
  },
  {
    id: "design",
    num: "04",
    title: "Design & 3D",
    img: svcDesign3d,
    items: ["Brand Identity", "Logo Design", "3D Product Modeling", "3D Animations", "Graphic Design"],
    secondaryTitle: "BRAND IDENTITY",
    secondaryList: ["01 — Concept", "02 — Modeling", "03 — Rendering", "04 — Motion"]
  }
];

function App() {
  const [introState, setIntroState] = useState('PLAYING'); // 'PLAYING', 'BLENDING', 'TEXT_HANDOFF', 'HERO_REVEAL', 'COMPLETE'

  useEffect(() => {
    if (introState === 'PLAYING') console.log('PLAYING');
  }, [introState]);
  const brandRef = useRef(null);
  const starfieldRef = useStarfield();
  const threeRef = useThreeBackground();

  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('home');
  const [activeProcessStep, setActiveProcessStep] = useState(0);
  const isNavigating = useRef(false);
  const processSectionRef = useRef(null);

  const [formNote, setFormNote] = useState('Your enquiry stays confidential.');
  const [formNoteColor, setFormNoteColor] = useState('var(--ink-low)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Service Modal State
  const [selectedService, setSelectedService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const handleServiceOpen = (service) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleServiceClose = () => {
    setIsServiceModalOpen(false);
    setTimeout(() => setSelectedService(null), 350);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isServiceModalOpen) {
        handleServiceClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isServiceModalOpen]);

  useEffect(() => {
    // We only observe reveals if we are not suppressing them
    if (introState === 'PLAYING' || introState === 'BLENDING' || introState === 'TEXT_HANDOFF') {
      return;
    }

    const revealOptions = { rootMargin: '-5% 0px -15% 0px', threshold: 0 };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          e.target.classList.remove('out');
          observer.unobserve(e.target); // Reveal once to prevent scroll gap blank screens
        }
      });
    }, revealOptions);

    const sectionRevealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          e.target.classList.remove('out');
          sectionRevealObserver.unobserve(e.target); // Reveal once to keep DOM stable
        }
      });
    }, revealOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    document.querySelectorAll('.reveal-section').forEach(el => sectionRevealObserver.observe(el));

    // Robust Active Section Detection
    const sections = ['home', 'services', 'work', 'process', 'contact'];

    let scrollTicking = false;

    const handleScroll = () => {
      if (isNavigating.current) return;

      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          // Bottom of page check (guarantees the last section activates on large screens)
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
            setActiveSection(sections[sections.length - 1]);
            scrollTicking = false;
            return;
          }

          let currentSection = 'home';
          const focusAnchor = window.innerHeight * 0.4; // 40% from top is the focal point

          for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i]);
            if (section) {
              const rect = section.getBoundingClientRect();
              if (rect.top <= focusAnchor) {
                currentSection = sections[i];
                break;
              }
            }
          }

          if (processSectionRef.current) {
            const rect = processSectionRef.current.getBoundingClientRect();
            const scrollDistance = focusAnchor - rect.top;
            if (scrollDistance > 0 && scrollDistance < rect.height) {
              const progress = scrollDistance / rect.height;
              // Slightly pad so the last step completes before the bottom
              const step = Math.max(0, Math.min(4, Math.floor(progress * 5.2)));
              setActiveProcessStep(step);
            } else if (scrollDistance <= 0) {
              setActiveProcessStep(0);
            } else {
              setActiveProcessStep(4);
            }
          }

          setActiveSection((prev) => prev !== currentSection ? currentSection : prev);
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Trigger immediately to set correct initial state

    return () => {
      observer.disconnect();
      sectionRevealObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [introState]);

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setActiveSection(sectionId);
    isNavigating.current = true;

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });

      // Dynamic lock: Release navigation lock when scrolling actually settles
      let scrollTimeout;
      const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isNavigating.current = false;
          window.removeEventListener('scroll', scrollHandler);
        }, 150);
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });

      // Fallback safety timeout in case scroll event fails to fire
      setTimeout(() => {
        isNavigating.current = false;
        window.removeEventListener('scroll', scrollHandler);
      }, 1500);
    } else {
      isNavigating.current = false;
    }

    if (menuOpen) setMenuOpen(false);
  };

  const handleCardAction = (e, actionCallback) => {
    e.preventDefault();
    const card = e.currentTarget;
    if (card.classList.contains('is-activating')) return;

    card.classList.add('is-activating');
    setTimeout(() => {
      card.classList.remove('is-activating');
      actionCallback();
    }, 380); // 380ms allows the click animation sweep to play
  };

  const closeMenu = () => setMenuOpen(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormNote('');
    const form = e.target;
    const data = {
      name: form.name.value,
      email: form.email.value,
      message: form.projectDetails.value,
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        setFormNote(result.message || 'Something went wrong. Please try again.');
        setFormNoteColor('rgba(255,100,100,0.9)');
      } else {
        setFormNote(result.message || 'Enquiry received. We\'ll be in touch soon.');
        setFormNoteColor('var(--blue-soft)');
        form.reset();
      }
    } catch {
      setFormNote('Unable to send your enquiry. Please check your connection and try again.');
      setFormNoteColor('rgba(255,100,100,0.9)');
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    if (introState !== 'COMPLETE') {
      document.body.style.overflow = 'hidden';
      // We don't disable pointer events globally on body because we might want pointer events
      // on the intro, but the hero content is disabled via css `.hero-intro-pending` pointer-events: none
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [introState]);

  const handleBlendStart = () => {
    setIntroState(prev => {
      if (prev === 'PLAYING') {
        console.log('BLENDING');
        return 'BLENDING';
      }
      return prev;
    });
  };

  const handleTextHandoffStart = () => {
    setIntroState(prev => {
      if (prev === 'BLENDING') {
        console.log('TEXT_HANDOFF');
        return 'TEXT_HANDOFF';
      }
      return prev;
    });
  };

  const handleTextHandoffComplete = () => {
    setIntroState(prev => {
      if (prev === 'TEXT_HANDOFF') {
        console.log('HERO_REVEAL');
        return 'HERO_REVEAL';
      }
      return prev;
    });
  };

  const handleComplete = () => {
    setIntroState('COMPLETE');
  };

  return (
    <>
      <div className={`app-container ${introState !== 'COMPLETE' ? 'intro-active' : ''} ${introState === 'PLAYING' || introState === 'BLENDING' || introState === 'TEXT_HANDOFF' ? 'hero-intro-pending' : ''}`}>

        {introState !== 'COMPLETE' && (
          <CinematicIntro
            brandRef={brandRef}
            onBlendStart={handleBlendStart}
            onTextHandoffStart={handleTextHandoffStart}
            onTextHandoffComplete={handleTextHandoffComplete}
            onComplete={handleComplete}
          />
        )}

        {/* Hero background and ambient effects are ALWAYS mounted and NOT hidden. */}
        <div className="space-bg">
          <canvas id="starfield" ref={starfieldRef}></canvas>
        </div>

        <div className="bg3d">
          <canvas id="bg3d-canvas" ref={threeRef}></canvas>
        </div>

        <div className="arch-lines" style={{ opacity: 0.5 }}>
          <div className="arch-v" style={{ left: '8%', top: '10vh', height: '60vh' }}></div>
          <div className="arch-v" style={{ right: '12%', top: '0', height: '40vh' }}></div>
          <div className="arch-h" style={{ top: '120px', left: '0', width: '20vw' }}></div>
        </div>

        <header className="nav">
          <div className="nav-inner">
            <a href="#home" className="brand" ref={brandRef} onClick={(e) => handleNavClick(e, 'home')}>PIXELNOVA</a>
            <nav className="links">
              <a href="#services" className={activeSection === 'services' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'services')}>Services</a>
              <a href="#work" className={activeSection === 'work' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'work')}>Work</a>
              <a href="#process" className={activeSection === 'process' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'process')}>Process</a>
              <a href="#contact" className={activeSection === 'contact' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'contact')}>Let’s Connect</a>
            </nav>
            <a href="#contact" className="nav-cta" onClick={(e) => handleNavClick(e, 'contact')}>
              Start a project <ArrowUpRight size={14} />
            </a>
            <button className="menu-toggle" id="menuToggle" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu />
            </button>
          </div>
        </header>

        <div className={`menu-backdrop ${menuOpen ? 'open' : ''}`} id="menuBackdrop" onClick={closeMenu}></div>
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobileMenu">
          <a href="#services" className={activeSection === 'services' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'services')}>Services</a>
          <a href="#work" className={activeSection === 'work' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'work')}>Work</a>
          <a href="#process" className={activeSection === 'process' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'process')}>Process</a>
          <a href="#contact" className={activeSection === 'contact' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'contact')}>Let’s Connect</a>
        </div>

        <main>
          <section className="hero" id="home">
            <div className="wrap">
              <div className="hero-grid">
                <div className="hero-content">
                  <span className="eyebrow reveal">Digital solutions + creative media</span>
                  <h1 className="hero-title">
                    <span className="reveal reveal-delay-1" style={{ display: 'block' }}>We Create</span>
                    <span className="reveal reveal-delay-2" style={{ display: 'block' }}>We Grow</span>
                  </h1>
                  <div className="hero-sub-line reveal reveal-delay-3">We Make Your Brand Stand Out.</div>
                  <p className="hero-desc reveal reveal-delay-4">
                    PixleNova combines web development, digital marketing, social media, branding and cinematic content to turn ideas into memorable digital experiences.
                  </p>
                  <div className="hero-btns reveal reveal-delay-5">
                    <a href="#contact" className="btn btn-primary" onClick={(e) => handleNavClick(e, 'contact')}>Build with us <ArrowUpRight size={15} /></a>
                    <a href="#work" className="btn btn-ghost" onClick={(e) => handleNavClick(e, 'work')}>Discover work <MoveDown size={15} /></a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="pad reveal-section" id="services">
            <div className="wrap">
              <div className="arch-lines">
                <div className="arch-v" style={{ left: '15%', top: '0', height: '100%' }}></div>
                <div className="arch-v" style={{ left: '60%', top: '15%', height: '70%' }}></div>
                <div className="arch-h" style={{ top: '80px', left: '0', width: '35%' }}></div>
              </div>
              <div className="sec-head">
                <span className="eyebrow reveal">01 / What we do</span>
                <h2 className="reveal reveal-delay-1">Creative thinking.<br />Digital execution.</h2>
                <p className="reveal reveal-delay-2">From your first idea to the final campaign, PixleNova brings strategy, design, technology and production together under one roof.</p>
              </div>
              <div className="services-grid">
                {servicesData.map((svc, idx) => (
                  <div key={svc.id} className={`reveal-wrapper reveal reveal-delay-${idx + 1}`}>
                    <button type="button" className="svc-card" onClick={(e) => handleCardAction(e, () => handleServiceOpen(svc))} aria-label={`View ${svc.title} details`}>
                      <div className="svc-card-img">
                        <img src={svc.img} alt={svc.title} loading="lazy" />
                      </div>
                      <div className="svc-card-body">
                        <div className="svc-header">
                          <span className="svc-num">{svc.num}</span>
                          <ArrowUpRight className="svc-arrow" size={16} />
                        </div>
                        <h3 className="svc-title">{svc.title}</h3>
                        <ul className="svc-details">
                          {svc.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pad reveal-section why-section">
            <div className="wrap">
              <div className="arch-lines">
                <div className="arch-v" style={{ left: '8%', top: '5%', height: '80%' }}></div>
                <div className="arch-v" style={{ right: '15%', top: '0', height: '100%' }}></div>
                <div className="arch-v" style={{ right: '40%', top: '30%', height: '40%' }}></div>
              </div>
              <div className="why-wrap">
                <div className="why-side">
                  <span className="eyebrow reveal">02 / Why PixleNova</span>
                  <h2 className="reveal reveal-delay-1" style={{ fontSize: 'clamp(34px,4.6vw,58px)', marginTop: '18px' }}>One team.<br />Many possibilities.</h2>
                  <p className="reveal reveal-delay-2">We don't just deliver a website, poster or video. We build a consistent brand system designed to look premium, communicate clearly and grow with your business.</p>
                </div>
                <div className="why-list">
                  <a href="#contact" className="why-item reveal" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="why-item-img">
                      <img src={whyStrategy} alt="Strategy First" loading="lazy" />
                      <div className="why-img-overlay"></div>
                    </div>
                    <div className="why-item-body">
                      <span className="num">01</span>
                      <h4>Strategy First</h4>
                      <p>Every creative decision starts with your audience and business goal.</p>
                      <ArrowUpRight size={18} className="why-arrow" />
                    </div>
                  </a>
                  <a href="#contact" className="why-item reveal reveal-delay-1" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="why-item-img">
                      <img src={whyDesign} alt="Premium Design" loading="lazy" />
                      <div className="why-img-overlay"></div>
                    </div>
                    <div className="why-item-body">
                      <span className="num">02</span>
                      <h4>Premium Design</h4>
                      <p>Clean, modern visuals that make your business look credible and memorable.</p>
                      <ArrowUpRight size={18} className="why-arrow" />
                    </div>
                  </a>
                  <a href="#contact" className="why-item reveal reveal-delay-2" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="why-item-img">
                      <img src={whyExecution} alt="Fast Execution" loading="lazy" />
                      <div className="why-img-overlay"></div>
                    </div>
                    <div className="why-item-body">
                      <span className="num">03</span>
                      <h4>Seamless Execution</h4>
                      <p>Focused workflows keep projects moving without unnecessary complexity.</p>
                      <ArrowUpRight size={18} className="why-arrow" />
                    </div>
                  </a>
                  <a href="#contact" className="why-item reveal reveal-delay-3" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="why-item-img">
                      <img src={whyGrowth} alt="Growth Mindset" loading="lazy" />
                      <div className="why-img-overlay"></div>
                    </div>
                    <div className="why-item-body">
                      <span className="num">04</span>
                      <h4>Growth Focused</h4>
                      <p>We design assets that support marketing, leads and long-term growth.</p>
                      <ArrowUpRight size={18} className="why-arrow" />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="pad reveal-section" id="work">
            <div className="wrap">
              <div className="arch-lines">
                <div className="arch-v" style={{ left: '25%', top: '0', height: '100%' }}></div>
                <div className="arch-h" style={{ top: '60%', right: '0', width: '25%' }}></div>
              </div>
              <div className="sec-head">
                <span className="eyebrow reveal">03 / Selected work</span>
                <h2 className="reveal reveal-delay-1">Ideas made visible.</h2>
                <p className="reveal reveal-delay-2">Discover a sample of the digital and creative worlds we can build for your brand.</p>
              </div>
              <div className="portfolio-filters reveal reveal-delay-3">
                <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`filter-chip ${filter === 'web' ? 'active' : ''}`} onClick={() => setFilter('web')}>Web</button>
                <button className={`filter-chip ${filter === 'brand' ? 'active' : ''}`} onClick={() => setFilter('brand')}>Branding</button>
                <button className={`filter-chip ${filter === 'media' ? 'active' : ''}`} onClick={() => setFilter('media')}>Media</button>
                <button className={`filter-chip ${filter === '3d' ? 'active' : ''}`} onClick={() => setFilter('3d')}>3D</button>
              </div>
              <div className="portfolio-grid">
                <div className="reveal-wrapper reveal reveal-delay-1" style={{ display: filter === 'all' || filter === 'web' ? 'flex' : 'none' }}>
                  <a href="#contact" className="p-card" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="p-card-visual">
                      <img className="p-card-img" src={projWeb} alt="Modern Business Experience" loading="lazy" />
                    </div>
                    <div className="p-card-info">
                      <div className="p-card-meta">
                        <span className="p-num">01</span>
                        <span className="p-cat">Web Design</span>
                      </div>
                      <h4 className="p-title">Modern Business Experience</h4>
                      <div className="p-link-wrap">
                        <span className="p-link">VIEW PROJECT <ArrowUpRight size={14} className="p-arrow" /></span>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="reveal-wrapper reveal reveal-delay-2" style={{ display: filter === 'all' || filter === 'brand' ? 'flex' : 'none' }}>
                  <a href="#contact" className="p-card" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="p-card-visual">
                      <img className="p-card-img" src={projBranding} alt="Premium Visual Identity" loading="lazy" />
                    </div>
                    <div className="p-card-info">
                      <div className="p-card-meta">
                        <span className="p-num">02</span>
                        <span className="p-cat">Branding</span>
                      </div>
                      <h4 className="p-title">Premium Visual Identity</h4>
                      <div className="p-link-wrap">
                        <span className="p-link">VIEW PROJECT <ArrowUpRight size={14} className="p-arrow" /></span>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="reveal-wrapper reveal reveal-delay-3" style={{ display: filter === 'all' || filter === 'media' ? 'flex' : 'none' }}>
                  <a href="#contact" className="p-card" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="p-card-visual">
                      <img className="p-card-img" src={projSocial} alt="Campaign Content System" loading="lazy" />
                    </div>
                    <div className="p-card-info">
                      <div className="p-card-meta">
                        <span className="p-num">03</span>
                        <span className="p-cat">Social Media</span>
                      </div>
                      <h4 className="p-title">Campaign Content System</h4>
                      <div className="p-link-wrap">
                        <span className="p-link">VIEW PROJECT <ArrowUpRight size={14} className="p-arrow" /></span>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="reveal-wrapper reveal reveal-delay-4" style={{ display: filter === 'all' || filter === 'media' ? 'flex' : 'none' }}>
                  <a href="#contact" className="p-card" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="p-card-visual">
                      <img className="p-card-img" src={projVideo} alt="Cinematic Product Story" loading="lazy" />
                    </div>
                    <div className="p-card-info">
                      <div className="p-card-meta">
                        <span className="p-num">04</span>
                        <span className="p-cat">Video Production</span>
                      </div>
                      <h4 className="p-title">Cinematic Product Story</h4>
                      <div className="p-link-wrap">
                        <span className="p-link">VIEW PROJECT <ArrowUpRight size={14} className="p-arrow" /></span>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="reveal-wrapper reveal reveal-delay-5" style={{ display: filter === 'all' || filter === 'media' ? 'flex' : 'none' }}>
                  <a href="#contact" className="p-card" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="p-card-visual">
                      <img className="p-card-img" src={projEvent} alt="Moments That Stay" loading="lazy" />
                    </div>
                    <div className="p-card-info">
                      <div className="p-card-meta">
                        <span className="p-num">05</span>
                        <span className="p-cat">Event Media</span>
                      </div>
                      <h4 className="p-title">Moments That Stay</h4>
                      <div className="p-link-wrap">
                        <span className="p-link">VIEW PROJECT <ArrowUpRight size={14} className="p-arrow" /></span>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="reveal-wrapper reveal reveal-delay-6" style={{ display: filter === 'all' || filter === '3d' ? 'flex' : 'none' }}>
                  <a href="#contact" className="p-card" onClick={(e) => handleCardAction(e, () => handleNavClick(e, 'contact'))}>
                    <div className="p-card-visual">
                      <img className="p-card-img" src={proj3d} alt="Next-Gen Product Visual" loading="lazy" />
                    </div>
                    <div className="p-card-info">
                      <div className="p-card-meta">
                        <span className="p-num">06</span>
                        <span className="p-cat">3D / Motion</span>
                      </div>
                      <h4 className="p-title">Next-Gen Product Visual</h4>
                      <div className="p-link-wrap">
                        <span className="p-link">VIEW PROJECT <ArrowUpRight size={14} className="p-arrow" /></span>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="pad reveal-section" id="process" ref={processSectionRef}>
            <div className="wrap">
              <div className="process-grid">
                <div className="process-left">
                  <div className="sec-head-left">
                    <span className="eyebrow reveal">04 / Our process</span>
                    <h2 className="reveal reveal-delay-1">From idea to impact.</h2>
                    <p className="reveal reveal-delay-2">A simple five-step system keeps every project focused, transparent and creative.</p>
                  </div>
                </div>

                <div className="process-right">
                  <div className="process-journey">
                    <div className="process-timeline-bg"></div>
                    <div className="process-timeline-progress" style={{ height: `${(activeProcessStep / 4) * 100}%` }}>
                      {activeProcessStep === 4 && <div className="timeline-signal"></div>}
                    </div>
                    
                    {[
                      { num: '01', title: 'Discover', desc: 'Understand your business, audience, goals and competitive space.', visualClass: 'visual-discover' },
                      { num: '02', title: 'Plan', desc: 'Create the strategy, structure, creative direction and roadmap.', visualClass: 'visual-plan' },
                      { num: '03', title: 'Create', desc: 'Design, develop, shoot, edit and build the experience.', visualClass: 'visual-create' },
                      { num: '04', title: 'Refine', desc: 'Review, improve and polish every important detail.', visualClass: 'visual-refine' },
                      { num: '05', title: 'Launch', desc: 'Deliver the final experience and support continued growth.', visualClass: 'visual-launch' }
                    ].map((step, idx) => {
                      const isActive = activeProcessStep === idx;
                      return (
                        <div 
                          key={idx} 
                          className={`process-step-row ${isActive ? 'active' : ''}`}
                          onClick={() => setActiveProcessStep(idx)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveProcessStep(idx); } }}
                          tabIndex={0}
                          role="button"
                          aria-pressed={isActive}
                        >
                          <div className={`process-indicator ${isActive ? 'active' : ''}`}>
                            <div className="indicator-core"></div>
                            {isActive && <div className="indicator-glow"></div>}
                          </div>
                          <div className="process-content-wrapper">
                            <div className={`process-visual ${step.visualClass} ${isActive ? 'active' : ''}`}></div>
                            <div className="process-num-label">{step.num}</div>
                            <div className="process-text-block">
                              <h4 className="process-heading">{step.title}</h4>
                              <p className="process-detail">{step.desc}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="pad reveal-section" id="marketing">
            <div className="wrap">
              <div className="arch-lines">
                <div className="arch-v" style={{ left: '45%', top: '0', height: '80%' }}></div>
                <div className="arch-v" style={{ right: '8%', top: '20%', height: '60%' }}></div>
              </div>
              <div className="marketing-wrap">
                <div>
                  <span className="eyebrow reveal reveal-once">05 / Marketing that moves</span>
                  <h2 style={{ fontSize: 'clamp(34px,4.6vw,58px)', marginTop: '18px' }}>
                    <span className="reveal reveal-once mkt-head-1" style={{ display: 'block' }}>Don't just get seen.</span>
                    <span className="reveal reveal-once mkt-head-2" style={{ display: 'block' }}>Get remembered.</span>
                  </h2>
                  <div className="marketing-list">
                    <div className="row reveal reveal-once mkt-list-1"><CheckCircle2 className="mkt-check" /> Search visibility that attracts the right audience</div>
                    <div className="row reveal reveal-once mkt-list-2"><CheckCircle2 className="mkt-check" /> Social content built for attention and consistency</div>
                    <div className="row reveal reveal-once mkt-list-3"><CheckCircle2 className="mkt-check" /> Paid campaigns focused on measurable growth</div>
                    <div className="row reveal reveal-once mkt-list-4"><CheckCircle2 className="mkt-check" /> Creative assets that keep your brand recognizable</div>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card reveal reveal-once mkt-stat-1">
                    <div className="stat-num mkt-num">360<span className="plus">°</span></div>
                    <div className="stat-label mkt-label">Creative coverage</div>
                  </div>
                  <div className="stat-card reveal reveal-once mkt-stat-2">
                    <div className="stat-num mkt-num">24<span className="plus">/7</span></div>
                    <div className="stat-label mkt-label">Digital presence</div>
                  </div>
                  <div className="stat-card reveal reveal-once mkt-stat-3">
                    <div className="stat-num mkt-num">1<span className="plus">+</span></div>
                    <div className="stat-label mkt-label">Unified team</div>
                  </div>
                  <div className="stat-card reveal reveal-once mkt-stat-4">
                    <div className="stat-num mkt-num">∞</div>
                    <div className="stat-label mkt-label">Ideas to create</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="cta-section reveal-section">
            <div className="wrap">
              <div className="arch-lines">
                <div className="arch-h" style={{ top: '0', left: '20%', width: '60%' }}></div>
              </div>
              <div className="cta-panel">
                <h2 className="reveal">Ready to make your brand impossible to ignore?</h2>
                <p className="reveal reveal-delay-1">Let's turn your next idea into a digital experience people remember.</p>
                <div className="reveal reveal-delay-2">
                  <a href="#contact" className="btn btn-primary" onClick={(e) => handleNavClick(e, 'contact')}>Start a conversation <ArrowUpRight size={15} /></a>
                </div>
              </div>
            </div>
          </section>

          <section className="connect-band reveal-section">
            <div className="wrap">
              <div>
                <span className="eyebrow reveal">06 / Let's connect</span>
                <h2 className="reveal reveal-delay-1">Let's create<br />something bold.</h2>
                <p className="sub reveal reveal-delay-2">Have a website, campaign, event or creative idea? Tell us what you're building and we'll take it from there.</p>
                <div className="connect-fields">
                  <div className="connect-field reveal reveal-delay-3">
                    <span className="label">Email</span>
                    <span className="val">Pixelnovaltd@gmail.com</span>
                  </div>
                  <div className="connect-field reveal reveal-delay-4">
                    <span className="label">Call / WhatsApp</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="val">+91 94451 32466</span>
                      <span className="val">+91 63749 11783</span>
                    </div>
                  </div>
                  <div className="connect-field reveal reveal-delay-5">
                    <span className="label">Location</span>
                    <span className="val">Chennai, India</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="pad reveal-section" id="contact">
            <div className="wrap">
              <div className="arch-lines">
                <div className="arch-v" style={{ left: '12%', top: '0', height: '100%' }}></div>
                <div className="arch-v" style={{ right: '25%', top: '10%', height: '70%' }}></div>
              </div>
              <div className="contact-wrap">
                <div className="contact-info">
                  <span className="eyebrow reveal contact-anim-0">07 / Contact</span>
                  <h2 className="reveal contact-anim-1">Let’s Build<br />Your next big idea.</h2>
                  <p className="reveal contact-anim-2">Share a few details and we'll get back to you with the right next step.</p>
                  <div className="contact-methods reveal contact-anim-3">
                    <div className="cm-group">
                      <span className="cm-label">Email</span>
                      <a className="cm-link" href="mailto:Pixelnovaltd@gmail.com" aria-label="Email PixelNova">
                        <span className="cm-val">Pixelnovaltd@gmail.com</span>
                        <span className="cm-arrow">↗</span>
                      </a>
                    </div>
                    <div className="cm-group" style={{ marginTop: '32px' }}>
                      <span className="cm-label">Call / WhatsApp</span>
                      <a className="cm-link" href="tel:+919445132466" aria-label="Call or WhatsApp +91 94451 32466">
                        <span className="cm-val">+91 94451 32466</span>
                        <span className="cm-arrow">↗</span>
                      </a>
                      <a className="cm-link" href="tel:+9163749111783" aria-label="Call or WhatsApp +91 63749 1178" style={{ marginTop: '12px' }}>
                        <span className="cm-val">+91 63749 11783</span>
                        <span className="cm-arrow">↗</span>
                      </a>
                    </div>
                  </div>
                  <div className="contact-socials reveal contact-anim-4">
                    <a className="soc-ic" href="#" aria-label="Instagram"><Instagram /></a>
                    <a className="soc-ic" href="#" aria-label="Facebook"><Facebook /></a>
                    <a className="soc-ic" href="#" aria-label="LinkedIn"><Linkedin /></a>
                  </div>
                </div>
                <form className="form-panel reveal contact-anim-5" id="contactForm" onSubmit={handleFormSubmit}>
                  <div className="form-row">
                    <div className="contact-field">
                      <label className="contact-label">Name</label>
                      <input className="contact-input" required name="name" placeholder="Your name" />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label">Phone</label>
                      <input className="contact-input" required name="phone" placeholder="+91" />
                    </div>
                  </div>
                  <div className="contact-field">
                    <label className="contact-label">Email</label>
                    <input className="contact-input" required type="email" name="email" placeholder="you@example.com" />
                  </div>
                  <div className="contact-field">
                    <label className="contact-label">Project details</label>
                    <textarea className="contact-textarea" required name="projectDetails" placeholder="Tell us what you need..."></textarea>
                  </div>
                  <button className="btn btn-primary submit-btn contact-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'SUBMITTING...' : (
                      <>START A CONVERSATION <ArrowUpRight className="contact-submit-arrow" size={15} style={{ marginLeft: '4px', transition: 'transform 0.3s ease' }} /></>
                    )}
                  </button>
                  {formNote && (
                    <p key={formNote} className="form-note animate-in" id="formNote" style={{ color: formNoteColor }}>
                      {formNote}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </section>
        </main>

        <footer>
          <div className="wrap">
            <div className="footer-top">
              <div className="footer-brand">
                <a href="#home" className="brand" onClick={(e) => handleNavClick(e, 'home')}>PIXELNOVA</a>
                <p>Digital solutions, creative media and marketing built to make your brand stand out.</p>
              </div>
              <div className="footer-col">
                <h5>Discover</h5>
                <a href="#services" onClick={(e) => handleNavClick(e, 'services')}>Services</a>
                <a href="#work" onClick={(e) => handleNavClick(e, 'work')}>Work</a>
                <a href="#process" onClick={(e) => handleNavClick(e, 'process')}>Process</a>
              </div>
              <div className="footer-col">
                <h5>Services</h5>
                <a href="#services" onClick={(e) => handleNavClick(e, 'services')}>Web Development</a>
                <a href="#services" onClick={(e) => handleNavClick(e, 'services')}>Digital Marketing</a>
                <a href="#services" onClick={(e) => handleNavClick(e, 'services')}>Creative Media</a>
                <a href="#services" onClick={(e) => handleNavClick(e, 'services')}>3D & Design</a>
              </div>
              <div className="footer-col">
                <h5>Start</h5>
                <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')}>Contact Us</a>
                <a href="mailto:Pixelnovaltd@gmail.com">Email Us</a>
                <a href="tel:+919445132466">Call Us (+91 94451 32466)</a>
                <a href="tel:+916374911178">Call Us (+91 63749 11783)</a>
              </div>
            </div>
            <div className="footer-bottom">
              <p>© <span id="year">{new Date().getFullYear()}</span> PixleNova. All rights reserved.</p>
              <span className="tagline-strip">DIGITAL CREATIVITY. POWERFUL RESULTS.</span>
            </div>
          </div>
        </footer>

        {/* SERVICE DETAIL MODAL */}
        <div
          className={`service-modal-overlay ${isServiceModalOpen ? 'open' : ''}`}
          onClick={handleServiceClose}
          aria-hidden={!isServiceModalOpen}
        >
          <div
            className={`service-modal cloud-shape ${isServiceModalOpen ? 'open' : ''}`}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="service-modal-title"
            aria-modal="true"
          >
            <div className="cloud-border-layer"></div>
            <div className="cloud-glow-layer"></div>
            <div className="cloud-travel-light"></div>

            <button type="button" className="service-modal-close" onClick={handleServiceClose} aria-label="Close modal">
              &times;
            </button>

            {selectedService && (
              <div className="cloud-content">
                <div className="cloud-primary">
                  <div className="service-modal-header cloud-anim cloud-delay-1">
                    <span className="svc-num">{selectedService.num}</span>
                    <h3 id="service-modal-title" className="svc-title">{selectedService.title}</h3>
                  </div>
                  <ul className="svc-details-modal">
                    {selectedService.items.map((item, i) => (
                      <li key={i} className={`cloud-anim cloud-delay-${i + 2}`}>
                        <CheckCircle2 size={16} className="svc-check-icon" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="service-modal-footer cloud-anim cloud-delay-btn">
                    <a
                      href="#contact"
                      className="modal-cta"
                      onClick={(e) => {
                        handleServiceClose();
                      }}
                    >
                      START A PROJECT <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>

                {selectedService.secondaryTitle && (
                  <div className="cloud-secondary cloud-anim cloud-delay-sec">
                    <h4 className="cloud-sec-title">{selectedService.secondaryTitle}</h4>
                    <ul className="cloud-sec-list">
                      {selectedService.secondaryList.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>

                    <div className="cloud-sec-label cloud-anim cloud-delay-label">
                      {selectedService.id === 'media' ? 'MEDIA SYSTEM / 01' : 'DIGITAL SYSTEM / 01'}
                    </div>

                    {selectedService.id === 'media' ? (
                      <div className="abstract-media-viewfinder cloud-anim cloud-delay-ui" aria-hidden="true">
                        <div className="vf-top">
                          <div className="vf-dots">
                            <span className="vf-dot"></span>
                            <span className="vf-dot"></span>
                          </div>
                        </div>
                        <div className="vf-center">
                          <div className="vf-bracket top-left"></div>
                          <div className="vf-bracket top-right"></div>
                          <div className="vf-bracket bottom-left"></div>
                          <div className="vf-bracket bottom-right"></div>
                          <div className="vf-crosshair"></div>
                        </div>
                        <div className="vf-bottom">
                          <div className="vf-rec">
                            <span>REC</span>
                            <span className="vf-rec-dot"></span>
                          </div>
                          <div className="vf-time">00:12:48</div>
                        </div>
                      </div>
                    ) : (
                      <div className="abstract-ui-wireframe cloud-anim cloud-delay-ui" aria-hidden="true">
                        <div className="wire-header">
                          <div className="wire-dot"></div>
                          <div className="wire-dot"></div>
                          <div className="wire-dot"></div>
                          <div className="wire-nav"></div>
                          <div className="wire-nav"></div>
                        </div>
                        <div className="wire-body">
                          <div className="wire-box">
                            <div className="wire-image-placeholder"></div>
                          </div>
                          <div className="wire-lines">
                            <div className="wire-line"></div>
                            <div className="wire-line short"></div>
                            <div className="wire-controls">
                              <div className="wire-ctrl"></div>
                              <div className="wire-ctrl"></div>
                            </div>
                          </div>
                        </div>
                        <div className="wire-accent-dot"></div>
                        <div className="wire-connection-line"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
