"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('club_id, role')
          .eq('id', session.user.id)
          .single();

        // 1. Priorité absolue au SuperAdmin
        if (profile?.role === 'superAdmin') {
          router.replace('/backoffice');
        } 
        // 2. Si c'est un admin avec un club
        else if (profile?.club_id) {
          router.replace('/dashboard');
        } 
        // 3. Sinon onboarding
        else {
          router.replace('/onboarding');
        }
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );
}