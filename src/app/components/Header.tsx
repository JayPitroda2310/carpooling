import { Link, useNavigate } from "react-router";
import { Car, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const displayName =
    profile?.full_name || (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Profile";

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-semibold text-xl hidden sm:block">RideShare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-foreground/80 hover:text-foreground transition-colors">
              Find a Ride
            </Link>
            <Link to="/publish" className="text-foreground/80 hover:text-foreground transition-colors">
              Publish a Ride
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-accent transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </span>
                  )}
                  <span className="max-w-[8rem] truncate">{displayName}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Log in</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-4">
            <Link
              to="/search"
              className="block px-4 py-2 text-foreground/80 hover:bg-accent rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find a Ride
            </Link>
            <Link
              to="/publish"
              className="block px-4 py-2 text-foreground/80 hover:bg-accent rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Publish a Ride
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-foreground/80 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-2 text-foreground font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
