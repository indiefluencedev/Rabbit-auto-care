'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import CouponForm from '@/components/forms/CouponForm';
import '../../../app/globals.css';
import { Plus } from 'lucide-react';
import Image from 'next/image';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
  const [currentCoupon, setCurrentCoupon] = useState({
    code: '',
    description: '',
    discount_percent: '',
    min_order_amount: '',
    is_permanent: false,
    expiry_date: '',
  });
  const [activeCount, setActiveCount] = useState(0);
  const MAX_ACTIVE_COUPONS = 15;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select(`*, user_coupons:user_coupons(count)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
    } else {
      const couponsWithUsage = data.map((coupon) => ({
        ...coupon,
        usage_count: coupon.user_coupons?.[0]?.count || 0,
      }));
      setCoupons(couponsWithUsage || []);
      const active = data.filter((coupon) => coupon.is_active).length;
      setActiveCount(active);
    }
    setLoading(false);
  };

  const handleSubmit = async (couponData) => {
    setLoading(true);
    try {
      if (formMode === 'add') {
        const { error } = await supabase.from('coupons').insert([
          {
            ...couponData,
            is_active: true,
          },
        ]);
        if (error) throw error;
        alert('Coupon created successfully!');
      } else {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', couponData.id);
        if (error) throw error;
        alert('Coupon updated successfully!');
      }
      resetForm();
      setCurrentView('list');
      fetchCoupons();
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Coupon deleted successfully');
        fetchCoupons();
      }
    }
  };

  const handleAddNew = () => {
    resetForm();
    setCurrentView('form');
  };

  const handleCancel = () => {
    setCurrentView('list');
  };

  const resetForm = () => {
    setFormMode('add');
    setCurrentCoupon({
      code: '',
      description: '',
      discount_percent: '',
      min_order_amount: '',
      is_permanent: false,
      expiry_date: '',
    });
  };

  const isExpired = (coupon) => {
    if (coupon.is_permanent) return false;
    return new Date(coupon.expiry_date) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className='p-6 max-w-6xl mx-auto'>
        {currentView === 'list' ? (
          <>
            {/* Header */}
            <div className='flex justify-between items-center mb-4'>
              <h1 className='text-2xl font-semibold text-gray-900'>Coupons</h1>
              <button
                onClick={handleAddNew}
                className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2'
              >
                <Plus size={16} />
                Create Coupon
              </button>
            </div>

            {/* Table */}
            <div className='bg-white rounded-lg border border-[#E0DEE3] overflow-x-auto'>
              {loading && !coupons.length ? (
                <p className='text-center py-4 text-gray-500 text-sm'>
                  Loading coupons...
                </p>
              ) : !coupons.length ? (
                <p className='text-center py-4 text-gray-500 text-sm'>
                  No coupons found.
                </p>
              ) : (
                <table className='w-full text-sm'>
                  <thead className='text-black border-b border-[#E0DEE3]'>
                    <tr>
                      <th className='px-5 py-4 text-left font-medium'>
                        Coupon
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Discount
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Minimum order value
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>Usage</th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Expiry date
                      </th>
                      <th className='px-5 py-4 text-left font-medium'>
                        Status
                      </th>
                      <th className='pr-7 py-4 text-center font-medium'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {coupons.map((coupon) => (
                      <tr
                        key={coupon.id}
                        className={
                          isExpired(coupon) && !coupon.is_permanent
                            ? 'bg-red-50'
                            : 'bg-white hover:bg-gray-50'
                        }
                      >
                        <td className='px-5 py-4 font-medium text-gray-900'>
                          {coupon.code}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          {coupon.discount_percent}%
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          ₹{coupon.min_order_amount}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          {coupon.usage_count || 0}
                        </td>
                        <td className='px-5 py-4 text-gray-700'>
                          {coupon.is_permanent ? (
                            <span>Permanent</span>
                          ) : (
                            formatDate(coupon.expiry_date)
                          )}
                        </td>
                        <td className='px-5 py-4'>
                          <span
                            className={`px-5 py-2 rounded-md text-xs font-medium ${
                              coupon.is_active
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gray-50 text-gray-500'
                            }`}
                          >
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='pr-7 py-4 flex justify-center'>
                          <Image
                            src='/assets/adminsvgs/delete.svg'
                            alt='Delete'
                            width={20}
                            height={20}
                            onClick={() => handleDelete(coupon.id)}
                            className='cursor-pointer hover:opacity-70'
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <CouponForm
            onClose={handleCancel}
            onSubmit={handleSubmit}
            initialData={currentCoupon}
            formMode={formMode}
            isLoading={loading}
            maxActiveCoupons={MAX_ACTIVE_COUPONS}
            activeCount={activeCount}
          />
        )}
      </div>
    </AdminLayout>
  );
}
