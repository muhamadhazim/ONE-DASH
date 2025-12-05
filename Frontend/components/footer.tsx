import Link from "next/link"
import { Twitter, Instagram, Facebook } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1a365d] text-white py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-1 mb-3 sm:mb-4">
              <span className="text-lg sm:text-xl font-semibold text-white">One</span>
              <span className="text-lg sm:text-xl font-semibold text-white">Dash</span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xs">
              Todos os direitos reservados. Veja nossa{" "}
              <Link href="#" className="underline hover:text-white transition-colors">
                Política de privacidade
              </Link>{" "}
              e{" "}
              <Link href="#" className="underline hover:text-white transition-colors">
                Termos de Uso
              </Link>
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-2">
            <Link href="#" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors py-1">
              Funcionalidades
            </Link>
            <Link href="#" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors py-1">
              Preço
            </Link>
            <Link href="#" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors py-1">
              Documentação
            </Link>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-2">
            <Link href="#" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors py-1">
              Contato
            </Link>
            <Link href="#" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors py-1">
              Ajuda e suporte
            </Link>
          </div>

          {/* Social Links */}
          <div>
            <span className="text-xs sm:text-sm text-gray-400 block mb-3 sm:mb-4">Siga-em</span>
            <div className="flex gap-4">
              <Link
                href="#"
                className="w-10 h-10 sm:w-auto sm:h-auto text-gray-300 hover:text-white transition-colors flex items-center justify-center"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 sm:w-auto sm:h-auto text-gray-300 hover:text-white transition-colors flex items-center justify-center"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 sm:w-auto sm:h-auto text-gray-300 hover:text-white transition-colors flex items-center justify-center"
              >
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
