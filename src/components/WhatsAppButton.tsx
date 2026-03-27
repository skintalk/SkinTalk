'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function WhatsAppButton() {
    const [showTip, setShowTip] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowTip(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AnimatePresence>
                {showTip && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{ background: '#fff', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '0.85rem', fontWeight: '500', color: '#333', border: '1px solid #eee', whiteSpace: 'nowrap' }}
                    >
                        Need help choosing? Chat with us
                        <button 
                            onClick={() => setShowTip(false)}
                            style={{ marginLeft: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#999', padding: '0 4px' }}
                        >
                            ×
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.a 
                href="https://wa.me/94771234567" // Placeholder number
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: '#25D366', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    fontSize: '30px', 
                    boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
                    textDecoration: 'none'
                }}
            >
                <FontAwesomeIcon icon={faWhatsapp} />
            </motion.a>
        </div>
    );
}
