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
                            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
                                <span className="text-white font-black text-xl">P</span>
                            </div>
                            <span className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                                Prana <span className="text-brand-primary">Market</span>
                            </span>
                        </Link>
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                            Tu destino premium para productos de belleza, salud y bienestar.
                            Calidad y sofisticación en cada detalle para potenciar tu mejor versión.
                        </p>
                        <div className="flex items-center space-x-4">
                            <a href="#" className="p-2 bg-brand-secondary/30 dark:bg-zinc-900 rounded-lg text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-brand-secondary/30 dark:bg-zinc-900 rounded-lg text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-brand-secondary/30 dark:bg-zinc-900 rounded-lg text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-widest mb-6">Tienda</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/" className="text-stone-500 dark:text-stone-400 hover:text-brand-primary text-sm transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/orders" className="text-stone-500 dark:text-stone-400 hover:text-brand-primary text-sm transition-colors">
                                    Mis Pedidos
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-stone-500 dark:text-stone-400 hover:text-brand-primary text-sm transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-stone-500 dark:text-stone-400 hover:text-brand-primary text-sm transition-colors">
                                    Registro
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-widest mb-6">Servicio al Cliente</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-stone-500 dark:text-stone-400 text-sm">
                                <Mail className="w-4 h-4 text-brand-primary" />
                                soporte@pranamarket.store
                            </li>
                            <li className="flex items-center gap-3 text-stone-500 dark:text-stone-400 text-sm">
                                <Phone className="w-4 h-4 text-brand-primary" />
                                +57 (300) 123-4567
                            </li>
                            <li className="flex items-center gap-3 text-stone-500 dark:text-stone-400 text-sm">
                                <MapPin className="w-4 h-4 text-brand-primary" />
                                Bogotá, Colombia
                            </li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-widest mb-6">Políticas</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm hover:text-brand-primary transition-colors cursor-pointer">
                                <ShieldCheck className="w-4 h-4" />
                                Términos y Condiciones
                            </li>
                            <li className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm hover:text-brand-primary transition-colors cursor-pointer">
                                <Truck className="w-4 h-4" />
                                Políticas de Envío
                            </li>
                            <li className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm hover:text-brand-primary transition-colors cursor-pointer">
                                <RefreshCw className="w-4 h-4" />
                                Devoluciones
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Benefits Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-stone-100 dark:border-white/5 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-secondary/30 dark:bg-pink-900/10 rounded-2xl flex items-center justify-center text-brand-primary">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-white">Envío Nacional</h4>
                            <p className="text-xs text-stone-500">Todo el territorio colombiano</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-secondary/30 dark:bg-pink-900/10 rounded-2xl flex items-center justify-center text-brand-primary">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-white">Pago Seguro</h4>
                            <p className="text-xs text-stone-500">Transacciones 100% protegidas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-secondary/30 dark:bg-pink-900/10 rounded-2xl flex items-center justify-center text-brand-primary">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-white">Garantía de Calidad</h4>
                            <p className="text-xs text-stone-500">Productos seleccionados</p>
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
