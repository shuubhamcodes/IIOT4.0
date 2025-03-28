import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Factory, Bell, PenTool as Tool, Users, Settings, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserRole {
  role: 'admin' | 'engineer' | 'operator';
}

const roleBasedNavItems = {
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/plants', icon: Factory, label: 'Plants' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/maintenance', icon: Tool, label: 'Maintenance' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  engineer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/plants', icon: Factory, label: 'Plants' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/maintenance', icon: Tool, label: 'Maintenance' },
  ],
  operator: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/plants', icon: Factory, label: 'Plants' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
  ],
};

export default function Navigation() {
  const [userRole, setUserRole] = useState<'admin' | 'engineer' | 'operator'>('operator');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function getUserRole() {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user?.id)
          .single();

        if (error) throw error;
        if (data) setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    }

    if (user) {
      getUserRole();
    }
  }, [user]);

  const navItems = roleBasedNavItems[userRole];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-20">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Navigation sidebar */}
      <nav className={`
        fixed inset-y-0 left-0 transform 
        lg:translate-x-0 lg:relative
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-200 ease-in-out
        w-64 bg-white shadow-lg z-10
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">InsightHub IIoT</h1>
          <p className="text-sm text-gray-600 mt-1 capitalize">{userRole} Dashboard</p>
        </div>

        <div className="mt-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50
                ${isActive ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-700' : ''}
              `}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}