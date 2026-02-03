'use client';

import Link from 'next/link';
import {
    Facebook,
    Instagram,
    Twitter,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    Truck,
    RefreshCw
} from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/10 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-pink-200 group-hover:scale-105 transition-transform">
                                <span className="text-white font-black text-xl">P</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Prana <span className="text-pink-600">Market</span>
                            </span>
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            Tu destino premium para productos de belleza, salud y bienestar.
                            Calidad y sofisticación en cada detalle para potenciar tu mejor versión.
                        </p>
                        <div className="flex items-center space-x-4">
                            <a href="#" className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg text-gray-400 hover:text-pink-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg text-gray-400 hover:text-pink-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg text-gray-400 hover:text-pink-600 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Tienda</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-pink-600 text-sm transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/orders" className="text-gray-500 dark:text-gray-400 hover:text-pink-600 text-sm transition-colors">
                                    Mis Pedidos
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-gray-500 dark:text-gray-400 hover:text-pink-600 text-sm transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-gray-500 dark:text-gray-400 hover:text-pink-600 text-sm transition-colors">
                                    Registro
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Servicio al Cliente</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                                <Mail className="w-4 h-4 text-pink-600" />
                                soporte@pranamarket.store
                            </li>
                            <li className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                                <Phone className="w-4 h-4 text-pink-600" />
                                +57 (300) 123-4567
                            </li>
                            <li className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                                <MapPin className="w-4 h-4 text-pink-600" />
                                Bogotá, Colombia
                            </li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-6">Políticas</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm hover:text-pink-600 transition-colors cursor-pointer">
                                <ShieldCheck className="w-4 h-4" />
                                Términos y Condiciones
                            </li>
                            <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm hover:text-pink-600 transition-colors cursor-pointer">
                                <Truck className="w-4 h-4" />
                                Políticas de Envío
                            </li>
                            <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm hover:text-pink-600 transition-colors cursor-pointer">
                                <RefreshCw className="w-4 h-4" />
                                Devoluciones
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Benefits Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-gray-100 dark:border-white/5 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/10 rounded-2xl flex items-center justify-center text-pink-600">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Envío Nacional</h4>
                            <p className="text-xs text-gray-500">Todo el territorio colombiano</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/10 rounded-2xl flex items-center justify-center text-pink-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Pago Seguro</h4>
                            <p className="text-xs text-gray-500">Transacciones 100% protegidas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/10 rounded-2xl flex items-center justify-center text-pink-600">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Garantía de Calidad</h4>
                            <p className="text-xs text-gray-500">Productos seleccionados</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-sm text-gray-400">
                        © {currentYear} Prana Market. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center space-x-6">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Aceptamos:</span>
                        <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                            {/* Simplified payment icons or labels */}
                            <span className="text-[10px] font-bold border border-gray-300 rounded px-1 text-gray-500">VISA</span>
                            <span className="text-[10px] font-bold border border-gray-300 rounded px-1 text-gray-500">MasterCard</span>
                            <span className="text-[10px] font-bold border border-gray-300 rounded px-1 text-gray-500">NEQUI</span>
                            <span className="text-[10px] font-bold border border-gray-300 rounded px-1 text-gray-500">PSE</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
