import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Navigation = ({
  activeView,
  onNavigate,
  hasUnsavedChanges = false,
  isProcessing = false,
  processingProgress = 0,
  onSettingsClick,
  onHelpClick,
  resultCount = 0,
  highConfidenceCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const views = [
    {
      id: 'workspace',
      label: 'Workspace',
      description: 'Load and prepare texts for analysis',
      icon: '📝',
    },
    {
      id: 'analyze',
      label: 'Analyze',
      description: 'Configure cipher methods and run analysis',
      icon: '🔍',
    },
    {
      id: 'results',
      label: 'Results',
      description: 'Browse and explore decoded patterns',
      icon: '📊',
      badge: resultCount > 0 ? resultCount : null,
      secondaryBadge: highConfidenceCount > 0 ? `⭐ ${highConfidenceCount}` : null,
    },
    {
      id: 'library',
      label: 'Library',
      description: 'Manage sources and saved sessions',
      icon: '📚',
    },
  ];

  const handleTabClick = (viewId) => {
    if (viewId === activeView) return; // Already active
    
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirm) return;
    }
    
    onNavigate(viewId);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleKeyDown = (e, viewId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(viewId);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Keyboard shortcuts (Ctrl/Cmd + 1-4)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (views[index]) {
          handleTabClick(views[index].id);
        }
      }
      
      // Esc closes mobile menu
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMobileMenuOpen, hasUnsavedChanges, activeView]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-50 shadow-sm"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-lg font-semibold text-gray-900">
              Cipher Tool
            </span>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1" role="tablist">
            {views.map((view) => (
              <button
                key={view.id}
                role="tab"
                aria-selected={activeView === view.id}
                aria-controls={`${view.id}-panel`}
                id={`${view.id}-tab`}
                onClick={() => handleTabClick(view.id)}
                onKeyDown={(e) => handleKeyDown(e, view.id)}
                title={view.description}
                className={`
                  relative px-4 py-2 rounded-t-lg transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${
                    activeView === view.id
                      ? 'text-blue-600 font-semibold border-b-3 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{view.icon}</span>
                  <span>{view.label}</span>
                  
                  {/* Primary Badge */}
                  {view.badge && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {view.badge}
                    </span>
                  )}
                  
                  {/* Secondary Badge (high confidence) */}
                  {view.secondaryBadge && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      {view.secondaryBadge}
                    </span>
                  )}
                </span>

                {/* Active indicator line */}
                {activeView === view.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Status + Actions */}
        <div className="flex items-center gap-4">
          {/* Processing Indicator */}
          {isProcessing && (
            <button
              onClick={() => {/* Open progress modal */}}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              title="Click for details"
            >
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Processing {processingProgress}%</span>
            </button>
          )}

          {/* Unsaved Changes */}
          {hasUnsavedChanges && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 bg-amber-50 rounded-lg"
              title="You have unsaved changes"
            >
              <span className="text-amber-600">●</span>
              <span>Unsaved</span>
            </div>
          )}

          {/* Settings Button */}
          {/* <button
            onClick={onSettingsClick}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings (Ctrl+,)"
            aria-label="Open settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button> */}

          {/* Help Button */}
          <button
            onClick={onHelpClick}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Help (F1)"
            aria-label="Open help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav
        className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-base font-semibold text-gray-900">
            Cipher Tool
          </span>
        </div>

        {/* Status Indicators (condensed) */}
        <div className="flex items-center gap-2">
          {isProcessing && (
            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          
          {hasUnsavedChanges && (
            <span className="text-amber-600">●</span>
          )}
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className="md:hidden fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleTabClick(view.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                    ${
                      activeView === view.id
                        ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{view.icon}</span>
                    <span>{view.label}</span>
                  </span>
                  
                  {view.badge && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {view.badge}
                    </span>
                  )}
                </button>
              ))}

              {/* Divider */}
              <div className="my-2 border-t border-gray-200" />

              {/* Settings */}
              {/* <button
                onClick={() => {
                  onSettingsClick();
                  closeMobileMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Settings</span>
              </button> */}

              {/* Help */}
              <button
                onClick={() => {
                  onHelpClick();
                  closeMobileMenu();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Help</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

Navigation.propTypes = {
  activeView: PropTypes.oneOf(['workspace', 'analyze', 'results', 'library']).isRequired,
  onNavigate: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool,
  isProcessing: PropTypes.bool,
  processingProgress: PropTypes.number,
  onSettingsClick: PropTypes.func.isRequired,
  onHelpClick: PropTypes.func.isRequired,
  resultCount: PropTypes.number,
  highConfidenceCount: PropTypes.number,
};

export default Navigation;