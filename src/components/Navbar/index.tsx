import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiX, FiUser, FiHome, FiInfo } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav ref={navbarRef} className={styles.navbar}>
      <div className={styles.navbarContainer}>
        {/* Logo */}
        <div className={styles.logo} onClick={() => scrollToSection('home')}>
          <img src="/assets/Statsboard.png" alt="Logo" className={styles.logoImage} />
          <span>theDashboard</span>
        </div>

        {/* Mobile menu button */}
        <button 
          className={styles.mobileMenuButton} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Navigation Links */}
        <div className={`${styles.navLinks} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <button 
            className={styles.navLink} 
            onClick={() => scrollToSection('home')}
            aria-label="Go to home"
          >
            <FiHome className={styles.navIcon} />
            <span>Home</span>
          </button>
          
          <button 
            className={styles.navLink} 
            onClick={() => scrollToSection('about')}
            aria-label="Learn more about us"
          >
            <FiInfo className={styles.navIcon} />
            <span>About Us</span>
          </button>

          {/* Profile Dropdown */}
          <div className={styles.profileContainer}>
            <button 
              className={`${styles.profileButton} ${isProfileOpen ? styles.profileButtonActive : ''}`}
              onClick={toggleProfileMenu}
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
            >
              <div className={styles.avatar}>
                <FiUser className={styles.userIcon} />
              </div>
              <span className={styles.profileName}>Account</span>
              <FaChevronDown className={`${styles.dropdownIcon} ${isProfileOpen ? styles.rotate : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem}>
                  <span>Profile</span>
                </button>
                <button className={styles.dropdownItem}>
                  <span>Settings</span>
                </button>
                <div className={styles.divider}></div>
                <button className={styles.dropdownItem}>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
