import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Menu, X, } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { useSelector } from 'react-redux';
import {  RootState } from '../redux/store';



const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const user  = useSelector((state: RootState) => state.user);
  console.log(user)

 

  const navItems = [
      { name: 'Features', path: '#features' },
      { name: 'Pricing', path: '#pricing' },
      { name: 'About', path: '#about' }
    ];


  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                SpeechCraft
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium flex items-center space-x-1"
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/auth/signup"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-shadow duration-200"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>
         

            {/* Mobile menu button */}
            {isMobile && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-gray-700 hover:text-purple-600"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobile && isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium px-2 py-1 flex items-center space-x-2"
                  >
                    <span>{item.name}</span>
                  </Link>
                ))}
                
                  <>
                    <Link
                      to="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium px-2 py-1"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/signup"
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full font-medium text-center w-28"
                    >
                      Sign Up
                    </Link>
                  </>
              
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;