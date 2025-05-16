'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const AuthContext = createContext<{
  user: { nome: string; perfil: string } | null;
  loading: boolean;
}>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    nome: string;
    perfil: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (pathname !== '/login') {
            router.push('/login');
          }
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        if (pathname !== '/login') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-gray-800">Sistema de Gestão Escolar</span>
                </div>
                {/* Desktop menu */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/dashboard"
                    className={`${
                      pathname === '/dashboard'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/alunos"
                    className={`${
                      pathname === '/alunos'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Alunos
                  </Link>
                  <Link
                    href="/observacoes"
                    className={`${
                      pathname === '/observacoes'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Observações
                  </Link>
                  <Link
                    href="/materias"
                    className={`${
                      pathname === '/materias'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Matérias
                  </Link>
                  <Link
                    href="/notas"
                    className={`${
                      pathname === '/notas'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Notas
                  </Link>
                  {user?.perfil === 'admin' && (
                    <>
                      <Link
                        href="/escolas"
                        className={`${
                          pathname === '/escolas'
                            ? 'border-blue-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        Escolas
                      </Link>
                      <Link
                        href="/monitores"
                        className={`${
                          pathname === '/monitores'
                            ? 'border-blue-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        Monitores
                      </Link>
                    </>
                  )}
                </div>
              </div>
              {/* Mobile hamburger */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 focus:outline-none"
                  aria-label="Abrir menu"
                >
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
              {/* Usuário e sair (desktop) */}
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">Olá, {user?.nome}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden px-2 pt-2 pb-3 space-y-1 bg-white border-b">
              <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Dashboard</Link>
              <Link href="/alunos" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Alunos</Link>
              <Link href="/observacoes" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Observações</Link>
              <Link href="/materias" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Matérias</Link>
              <Link href="/notas" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Notas</Link>
              {user?.perfil === 'admin' && (
                <>
                  <Link href="/escolas" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Escolas</Link>
                  <Link href="/monitores" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100">Monitores</Link>
                </>
              )}
              <div className="border-t mt-2 pt-2 flex items-center justify-between">
                <span className="text-sm text-gray-700">Olá, {user?.nome}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </nav>
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}

// Adicione este hook:
export function useAuth() {
  return useContext(AuthContext);
}
