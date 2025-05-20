import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-white shadow px-4 py-2 flex items-center">
      <Link href="/dashboard" className="mr-4 text-gray-700 hover:text-indigo-600">
        Dashboard
      </Link>
      <Link href="/alunos" className="mr-4 text-gray-700 hover:text-indigo-600">
        Alunos
      </Link>
      <Link href="/observacoes" className="mr-4 text-gray-700 hover:text-indigo-600">
        Observações
      </Link>
      <Link href="/materias" className="mr-4 text-gray-700 hover:text-indigo-600">
        Matérias
      </Link>
      <Link href="/notas" className="mr-4 text-gray-700 hover:text-indigo-600">
        Notas
      </Link>
      {/* Outras abas, se houver */}
    </nav>
  );
}
