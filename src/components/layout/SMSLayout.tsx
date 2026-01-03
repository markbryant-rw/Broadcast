import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Radio, LogOut, Settings } from 'lucide-react';

interface SMSLayoutProps {
  children: ReactNode;
}

export default function SMSLayout({ children }: SMSLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        {/* Logo - Returns to Dashboard */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Radio className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold hidden sm:inline">Broadcast</span>
        </Link>

        {/* Page Title - Center */}
        <h1 className="text-base sm:text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          SMS Prospecting
        </h1>

        {/* User Menu - Minimal */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Full-width Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
