import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/browse', icon: '🍳', label: 'Recipes' },
  { to: '/meal-plan', icon: '📅', label: 'Plan' },
  { to: '/grocery-list', icon: '🛒', label: 'List' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
