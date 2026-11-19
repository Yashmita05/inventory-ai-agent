// src/NavBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, TrendingUp, ShoppingCart, PlusSquare } from 'lucide-react';

// Glassmorphic floating pill navigation bar with CSS transitions
const NavBar = () => {
  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/inventory', label: 'Inventory', icon: <Package size={18} /> },
    { to: '/forecast', label: 'Forecast', icon: <TrendingUp size={18} /> },
    { to: '/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { to: '/record-sale', label: 'Record Sale', icon: <PlusSquare size={18} /> },
  ];

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/30 backdrop-blur-md rounded-3xl px-4 py-2 shadow-lg border border-white/20 flex space-x-2 z-10">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          className={({ isActive }) =>
            `relative flex items-center gap-1 px-3 py-1 rounded-full transition-all duration-300` +
            (isActive
              ? ' bg-white/60 backdrop-blur-sm border border-white/40 text-gray-800 font-semibold'
              : ' text-gray-600 hover:bg-white/40 hover:text-gray-800')
          }
        >
          {link.icon}
          <span className="text-sm font-medium">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default NavBar;

