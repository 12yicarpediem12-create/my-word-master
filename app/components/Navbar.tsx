"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink = ({ href, currentPath, children }: { href: string; currentPath: string; children: React.ReactNode }) => {
  const isActive = currentPath === href;
  return (
    <Link 
      href={href} 
      className={`text-sm px-4 py-2 rounded-md font-medium transition-colors ${
        isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 py-3 px-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-medium tracking-tight">
            <span className="text-blue-500">W</span>
            <span className="text-red-500">o</span>
            <span className="text-yellow-500">r</span>
            <span className="text-blue-500">d</span>
            <span className="text-green-500">M</span>
            <span className="text-red-500">aster</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <NavLink href="/" currentPath={pathname}>Dashboard</NavLink>
          <NavLink href="/manage" currentPath={pathname}>Manage</NavLink>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
            Y
          </div>
        </div>
      </div>
    </nav>
  );
}