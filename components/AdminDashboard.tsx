/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CreditCode {
  code: string;
  credits: number;
  email: string | null;
  used: boolean;
  usedByEmail: string | null;
  usedAt: string | null;
  createdAt: string;
}

interface CodesResponse {
  total: number;
  used: number;
  unused: number;
  codes: CreditCode[];
}

const AdminDashboard: React.FC = () => {
  const [codes, setCodes] = useState<CreditCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formCredits, setFormCredits] = useState('25');
  const [formEmail, setFormEmail] = useState('');
  const [formCustomCode, setFormCustomCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Load codes
  const loadCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/list-codes');
      if (response.ok) {
        const data: CodesResponse = await response.json();
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('Failed to load codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
    // Refresh every 5 seconds
    const interval = setInterval(loadCodes, 5000);
    return () => clearInterval(interval);
  }, []);

  // Create code
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    setFormSuccess(null);

    const credits = parseInt(formCredits, 10);
    if (!credits || credits <= 0) {
      setFormError('Credits must be a positive number');
      setCreating(false);
      return;
    }

    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setFormError('Invalid email format');
      setCreating(false);
      return;
    }

    try {
      const body: any = { credits };
      if (formEmail.trim()) body.email = formEmail.trim();
      if (formCustomCode.trim()) body.code = formCustomCode.trim().toUpperCase();

      const response = await fetch('/api/admin/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create code');
      }

      const result = await response.json();
      setFormSuccess(`Code created: ${result.code} (${result.credits} credits${result.email ? ` for ${result.email}` : ''})`);
      setFormEmail('');
      setFormCustomCode('');
      loadCodes();
    } catch (error: any) {
      setFormError(error.message || 'Failed to create code');
    } finally {
      setCreating(false);
    }
  };

  // Filter codes
  const filteredCodes = codes.filter(code => {
    if (filter === 'used' && !code.used) return false;
    if (filter === 'unused' && code.used) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        code.code.toLowerCase().includes(term) ||
        (code.email && code.email.toLowerCase().includes(term)) ||
        (code.usedByEmail && code.usedByEmail.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const stats = {
    total: codes.length,
    used: codes.filter(c => c.used).length,
    unused: codes.filter(c => !c.used).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage credit codes and view usage statistics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Codes</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Used</div>
            <div className="text-3xl font-bold text-green-600">{stats.used}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Unused</div>
            <div className="text-3xl font-bold text-blue-600">{stats.unused}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Code Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Code</h2>
              
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    value={formCredits}
                    onChange={(e) => setFormCredits(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Restrict code to specific email</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formCustomCode}
                    onChange={(e) => setFormCustomCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
                </div>

                {formError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded">
                    <p className="text-sm">{formError}</p>
                  </div>
                )}

                {formSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded">
                    <p className="text-sm font-semibold">{formSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Code'}
                </button>
              </form>
            </div>
          </div>

          {/* Codes List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('unused')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'unused'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Unused ({stats.unused})
                  </button>
                  <button
                    onClick={() => setFilter('used')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'used'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Used ({stats.used})
                  </button>
                </div>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Codes Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading codes...</p>
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No codes found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Credits</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Used By</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code, index) => (
                        <motion.tr
                          key={code.code}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <code className="font-mono font-semibold text-purple-600">{code.code}</code>
                          </td>
                          <td className="py-3 px-4 font-semibold">{code.credits}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {code.email || <span className="text-gray-400">Any</span>}
                          </td>
                          <td className="py-3 px-4">
                            {code.used ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Used
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {code.usedByEmail || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(code.createdAt).toLocaleDateString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to App */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

