'use client';

import React, { useState } from 'react';
import { useAdmin, type Route } from '../context/AdminContext';
import { Map, Plus, Edit2, Trash2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

export function RoutesPage() {
    const { routes, addRoute, updateRoute, deleteRoute, customers } = useAdmin();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '', city: '', description: '' });

    const openModal = (route?: Route) => {
        if (route) {
            setEditingRoute(route);
            setFormData({
                name: route.name,
                code: route.code,
                city: route.city || '',
                description: route.description || ''
            });
        } else {
            setEditingRoute(null);
            setFormData({ name: '', code: '', city: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRoute) {
            await updateRoute(editingRoute.id, formData);
        } else {
            await addRoute(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this route?')) {
            await deleteRoute(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Route Management</h2>
                    <p className="text-gray-600 mt-1">Manage delivery routes and customer assignments.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Route
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map(route => {
                    const assignedCustomers = customers.filter(c => c.routeId === route.id).length;
                    return (
                        <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Map className="w-5 h-5" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(route)} className="text-gray-300 hover:text-blue-500 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(route.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 mb-1">{route.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">{route.code}</span>
                                {route.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {route.city}</span>}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{assignedCustomers} customers assigned</span>
                            </div>

                            {route.description && (
                                <p className="text-sm text-gray-500 mt-4 line-clamp-2">{route.description}</p>
                            )}
                        </div>
                    );
                })}

                {routes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Map className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No routes defined yet.</p>
                        <button onClick={() => openModal()} className="mt-4 text-blue-600 hover:underline">Create your first route</button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">{editingRoute ? 'Edit Route' : 'Add Route'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Morning Delivery A" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Route Code</label>
                                    <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="RT-01" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="City Name" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Areas covered..." />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
